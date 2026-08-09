// models/CrawlJob.ts
import {  CRAWLING_STATUSES, CrawlingStatus } from "@/dtos/crawl.dto.js";
import mongoose, { Document, Schema } from "mongoose";



export interface ICrawlJob {
  workspace: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  targetUrl: string;
  status: CrawlingStatus;
  pagesDiscovered: number;
  pagesIngested: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface ICrawlJobDoc extends Document , ICrawlJob{};

const CrawlJobSchema = new Schema<ICrawlJobDoc>({
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  targetUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: CRAWLING_STATUSES, 
    default: 'pending' 
  },
  pagesDiscovered: { type: Number, default: 0 },
  pagesIngested: { type: Number, default: 0 },
  errorMessage: { type: String, default: null },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

export default mongoose.model<ICrawlJobDoc>('CrawlJob', CrawlJobSchema);