import Organization from "@/models/Organization";
import mongoose, { Document, Schema }  from "mongoose";

export interface IChunk extends Document{
  knowledgeBase: mongoose.Types.ObjectId
  organization:mongoose.Types.ObjectId
  content:string
  embedding:number[]
  pageNumber:number
  chunkIndex:number
  createdAt:Date
}

const ChunkSchema = new Schema<IChunk>({
    knowledgeBase:{
      type:Schema.Types.ObjectId,
      ref:"KnowledgeBase",
      required:true
    },
    organization:{
      type:Schema.Types.ObjectId,
      ref:"Organization",
      required:true
    },
    content:{
      type:String,
      required:true,
    },
    embedding:{
      type:[Number],
      required:true
    },
    pageNumber:{
      type:Number,
      required:true
    },
    chunkIndex:{
      type:Number,
      required:true
    }
},{
  timestamps:true
})

ChunkSchema.index({KnowledgeBase:1 , chunkIndex:1})
ChunkSchema.index({Organization:1})

export default mongoose.model<IChunk>("Chunk", ChunkSchema)