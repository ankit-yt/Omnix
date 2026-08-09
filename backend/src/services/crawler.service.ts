import CrawlJob, { ICrawlJob, ICrawlJobDoc } from "@/models/CrawlJob.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import organizationRepository from "@/repositories/organization.repository.js"; // NEW IMPORT
import AppError from "@/utils/AppError.js";
import mongoose from "mongoose";
import { Browser, chromium, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { logger } from "@/utils/logger.js";
import documentService from "@/services/document.service.js";
import crawlJobRepository from "@/repositories/crawlJob.repository.js";
import KnowledgeDocument from "@/models/KnowledgeDocument.js";
import knowledgeDocumentRepository from "@/repositories/knowledgeDocument.repository.js";

class crawlerService {

  async startWorkspaceCrawl(
    workspaceId: string,
    organizationId: string,
    sourceUrl: string
  ) {
    let rootUrl: URL;

    try {
      rootUrl = new URL(sourceUrl);
    } catch {
      throw new AppError("Invalid source URL provided.", 400);
    }

    // --- NEW: Dynamic Plan Validation ---
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new AppError("Organization not found.", 404);
    }

    const limits = organization.cachedLimits;
    if (!limits || !limits.crawlingEnabled) {
      throw new AppError("Web crawling is not supported on your current plan. Please upgrade to Pro.", 403);
    }

    const maxPagesToCrawl = limits.maxPagesPerCrawl || 0;
    if (maxPagesToCrawl <= 0) {
      throw new AppError("Your plan has a 0 page crawl limit.", 403);
    }
    // ------------------------------------

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) throw new AppError("Workspace not found", 404);

    if (workspace.crawlingStatus?.status === 'pending' || workspace.crawlingStatus?.status === 'crawling') {
      throw new AppError('A crawl is already in progress for this workspace. Please wait it for finish.', 400);
    }

    const existingCrawledDocs = await knowledgeDocumentRepository.deleteAllCrawledDocuments(workspaceId, 'webpage');

    for (const doc of existingCrawledDocs) {
      try {
        await documentService.deleteAndRetrieveDocument(doc._id.toString(), organizationId);

      } catch (err) {
        logger.warn(`Failed to delete previous crawl document ${(doc._id)}:`, err);
      }
    }

    const session = await mongoose.startSession();
    let job!: ICrawlJobDoc;

    try {
      await session.withTransaction(async () => {
        job = await crawlJobRepository.createCrawlJob(
          {
            workspace: workspaceId,
            organization: organizationId,
            targetUrl: rootUrl.origin,
            status: "pending",
          },
          session
        );

        await workspaceRepository.updateCrawlingStatus(
          workspaceId,
          { status: "pending" },
          session
        );
      });
    } catch (dbError) {
      logger.error(
        `[CRITICAL_DB_ERROR] Failed to create crawl job for workspace ${workspaceId}:`,
        dbError
      );

      throw new AppError(
        "Database error occurred while starting the crawl.",
        500
      );
    } finally {
      await session.endSession();
    }

    // Pass the dynamic limit to the background worker
    this.processCrawl(job._id.toString(), rootUrl, maxPagesToCrawl).catch((error) => {
      logger.error(
        `[CRAWLER_ERROR] Background crawl failed for job ${job._id}:`,
        error
      );
    });

    return job;
  }

  // Updated signature to accept maxPages
  private async processCrawl(jobId: string, rootUrl: URL, maxPages: number) {
    const job = await CrawlJob.findById(jobId);
    if (!job) return;

    job.status = 'crawling';
    await job.save();
    await workspaceRepository.updateCrawlingStatus(job.workspace.toString(), { status: 'crawling' });

    const visited = new Set<string>();
    const queue: string[] = [rootUrl.origin];
    let pageIngested = 0;

    // Accumulator for all combined text across the website
    let combinedWebsiteText = "";

    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox']
      });

      const context = await browser.newContext({
        userAgent: 'OmnixAI-Bot/1.0',
        viewport: { width: 1280, height: 720 }
      })

      // Use the dynamic maxPages limit here
      while (queue.length > 0 && visited.size < maxPages) {
        const currentUrl = queue.shift()!;

        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        let page: Page | null = null;

        try {
          page = await context.newPage();
          await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 15000 });

          await this.autoScroll(page);

          const renderedHtml = await page.content();

          const { title, cleanText, newLinks } = this.parseRenderedHtml(renderedHtml, currentUrl, rootUrl.origin);

          if (cleanText.length > 200) {
            // Append the text with a clear separator
            combinedWebsiteText += `\n\n--- Source: ${title} (${currentUrl}) ---\n\n${cleanText}\n\n`;
            pageIngested++;
          }

          for (const link of newLinks) {
            if (!visited.has(link)) queue.push(link);
          }

          if (visited.size % 2 === 0) {
            job.pagesDiscovered = visited.size + queue.length;
            job.pagesIngested = pageIngested;
            await job.save();
          }
          await workspaceRepository.updateCrawlingStatus(job.workspace.toString(), {
            status: 'crawling',
            pagesCrawled: pageIngested
          });

        } catch (pageError) {
          logger.warn(`Failed to crawl page: ${currentUrl}`, pageError);
        } finally {
          if (page) await page.close();
        }
      }

      // ONCE CRAWLING IS DONE, INGEST THE COMBINED TEXT AS ONE DOCUMENT
      if (combinedWebsiteText.trim().length > 0) {
        const documentTitle = `${rootUrl.hostname} - Website Crawl`;
        await this.ingestWebPage(job, rootUrl.origin, documentTitle, combinedWebsiteText.trim());
      }

      job.status = 'completed';
      job.pagesDiscovered = visited.size;
      job.pagesIngested = pageIngested;
      job.completedAt = new Date();
      await job.save();

      await workspaceRepository.updateCrawlingStatus(job.workspace.toString(), {
        status: 'completed',
        lastCrawledAt: new Date(),
        pagesCrawled: pageIngested
      });

    } catch (fatalError: any) {
      job.status = 'failed';
      job.errorMessage = fatalError.message;
      await job.save();
      await workspaceRepository.updateCrawlingStatus(job.workspace.toString(), {
        status: 'failed',
        errorMessage: fatalError
      });
    } finally {
      if (browser) await browser.close();
    }
  }

  private async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 600;
        let scrolls = 0;
        const maxScrolls = 20;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrolls++;

          if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
            clearInterval(timer);
            resolve();
          }

        }, 500);
      });
    });

    try {
      await page.waitForLoadState('networkidle', { timeout: 3000 });
    } catch (e) { }
  }

  private parseRenderedHtml(html: string, currentUrl: string, baseUrl: string) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim() || 'Untitled Page';
    const newLinks: string[] = [];

    $('a').each((_, element) => {
      let href = $(element).attr('href');
      if (!href) return;
      href = href.split('#')[0];
      try {
        const resolvedUrl = new URL(href, baseUrl);
        if (resolvedUrl.origin === baseUrl) {
          newLinks.push(resolvedUrl.href);
        }
      } catch (e) { }
    });

    $('script, style, noscript, iframe, nav, footer, header, aside, [role="navigation"], .menu').remove();

    let cleanText = $('body').text();
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    return { title, cleanText, newLinks };
  }

  private async ingestWebPage(job: ICrawlJob, url: string, title: string, text: string) {
    await documentService.processWebPage(
      job.workspace.toString(),
      job.organization.toString(),
      url,
      title,
      text
    );
  }
}

export default new crawlerService();