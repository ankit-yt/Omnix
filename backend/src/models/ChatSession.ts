import mongoose, { Document, Schema } from "mongoose";
import { softDeletePlugin } from "@/models/base/plugins.js";
import { ISoftDelete } from "@/models/base/types.js";

export interface IChatSession extends ISoftDelete {
  organization: mongoose.Types.ObjectId;
  sessionId: string;
  currentPage: string;
  pageTitle: string;
  userAgent: string;
  conversationSummary: string;
  isActive: boolean;
  messageCount: number;
  totalTokenUsed: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatSessionDoc extends IChatSession, Document {}

const ChatSessionSchema = new Schema<IChatSessionDoc>({
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  currentPage: {
    type: String,
    required: true
  },
  pageTitle: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  conversationSummary: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  messageCount: {
    type: Number,
    default: 0
  },
  totalTokenUsed: {
    type: Number,
    default: 0,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      const { __v, ...safeJson } = ret;
      return safeJson;
    }
  }
});

ChatSessionSchema.plugin(softDeletePlugin);

ChatSessionSchema.index({ sessionId: 1 });
ChatSessionSchema.index({ organization: 1, createdAt: -1 });
ChatSessionSchema.index({ lastActivityAt: 1 }); 

export default mongoose.model<IChatSessionDoc>('ChatSession', ChatSessionSchema);