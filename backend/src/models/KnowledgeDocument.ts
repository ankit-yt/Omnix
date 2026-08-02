import mongoose, { Document, Schema } from "mongoose";
import { auditPlugin, softDeletePlugin } from "@/models/base/plugins.js";
import { IAudit, ISoftDelete } from "@/models/base/types.js";


export interface IKnowledgeDocument extends ISoftDelete, IAudit {
  _id?: mongoose.Types.ObjectId; 
  organization: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;

  sourceType: 'file' | 'webpage';

  originalFileName: string;
  title: string;
  sourceUrl: string;
  storageKey:string;
  fileSizeByte: number;
  mimeType: string;

  status: 'processing' | 'ready' | 'failed';

  totalChunks: number;

  processingError: string | null;
  processedAt: Date | null;

  uploadedBy: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeDocumentDoc extends Omit<IKnowledgeDocument, '_id'>, Document {}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocumentDoc>({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  sourceType:{type:String , enum:['file', 'webpage'] , required: true,},
  originalFileName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  sourceUrl: { type: String, required: true },
  storageKey:{type:String , required:true},
  fileSizeByte: { type: Number, required: true, min: 0 },
  mimeType: { type: String, required: true },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },
  totalChunks: { type: Number, default: 0 },
  processingError: { type: String, default: null },
  processedAt: { type: Date, default: null },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      const { __v, ...safeJson } = ret;
      return safeJson;
    }
  }
});

KnowledgeDocumentSchema.plugin(softDeletePlugin);
KnowledgeDocumentSchema.plugin(auditPlugin);

KnowledgeDocumentSchema.index({ workspace: 1, status: 1 });
KnowledgeDocumentSchema.index({ workspace: 1, isDeleted: 1 });
KnowledgeDocumentSchema.index({ organization: 1, status: 1 });

export default mongoose.model<IKnowledgeDocumentDoc>('KnowledgeDocument', KnowledgeDocumentSchema);