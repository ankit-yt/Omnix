import { ICrawlJob } from "@/models/CrawlJob.js";

export const CRAWLING_STATUSES = [
  'idle',
  'pending',
  'crawling',
  'completed',
  'failed',
] as const;

export type CrawlingStatus = typeof CRAWLING_STATUSES[number];

export interface UpdateCrawlingStatusDto {
  status?: CrawlingStatus;
  lastCrawledAt?: Date | null;
  pagesCrawled?: number;
  errorMessage?: string | null;
}

export interface createCrawlJobDto{
  workspace:string;
  organization:string,
  targetUrl:string,
  status: ICrawlJob["status"]
}