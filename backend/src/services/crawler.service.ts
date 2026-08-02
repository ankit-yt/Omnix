import CrawlJob from "@/models/CrawlJob.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import AppError from "@/utils/AppError.js";
import mongoose from "mongoose";

const MAX_PAGE_PER_CRAWL = 50;

class crawlerService{
  async startWorkspaceCrawl(workspaceId:string , organizationId:string , sourceUrl:string){
    let rootUrl:URL;
    try{
      rootUrl = new URL(sourceUrl);
    }catch(e){
     throw new AppError("Invalid source URL provided.", 400);
    }

    const job = await CrawlJob.create({
      workspace: new mongoose.Types.ObjectId(workspaceId),
      organization:new mongoose.Types.ObjectId(organizationId),
      targetUrl:rootUrl.origin,
      status:'pending',
    });

    await workspaceRepository.updateCrawlingStatus(workspaceId,{status:'pending'});

  };

  private async processCrawl(jobId:string , rootUrl:URL){
    const job = await CrawlJob.findById(jobId);
    if(!job)return;

    job.status = 'crawling';
    await job.save();
    await workspaceRepository.updateCrawlingStatus(job.workspace.toString() , {status:'crawling'});

    const visited = nwe Set<string>();
  
  }
}