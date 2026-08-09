import { createCrawlJobDto } from "@/dtos/crawl.dto.js";
import CrawlJob, { ICrawlJob, ICrawlJobDoc } from "@/models/CrawlJob.js";
import {ClientSession} from 'mongoose'

class CrawlJobRepository{

  async createCrawlJob(data:createCrawlJobDto , session?:ClientSession):Promise<ICrawlJobDoc>{
   const [job] =await CrawlJob.create([data], {session});
   return job;
  }
}

export default new CrawlJobRepository();