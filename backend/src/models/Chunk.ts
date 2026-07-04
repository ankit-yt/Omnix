import mongoose, { Document, Schema } from "mongoose";

export interface IChunk {
  knowledgeDocument: mongoose.Types.ObjectId; 
  workspace: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  
  content: string;
  embedding: number[];
  pageNumber?: number; 
  chunkIndex: number;
  createdAt?: Date;
}


export interface IChunkDoc extends IChunk, Document {}

const ChunkSchema = new Schema<IChunkDoc>({
    knowledgeDocument: { 
      type: Schema.Types.ObjectId,
      ref: "KnowledgeDocument", 
      required: true
    },
    workspace: { 
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true
    },
    pageNumber: {
      type: Number, 
    },
    chunkIndex: {
      type: Number,
      required: true
    }
}, {
  timestamps: { createdAt: true, updatedAt: false } 
});

ChunkSchema.index({ knowledgeDocument: 1, chunkIndex: 1 });
ChunkSchema.index({ workspace: 1 });
ChunkSchema.index({ organization: 1 });

export default mongoose.model<IChunkDoc>("Chunk", ChunkSchema);