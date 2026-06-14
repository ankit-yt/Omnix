import { auditPlugin, softDeletePlugin } from "@/models/base/plugins";
import mongoose, { Document, Schema } from "mongoose";

export interface IKnowledgeBase extends Document {
  organization:mongoose.Types.ObjectId
  fileName:string
  fileUrl:string
  fileSize:number
  mimeType:string
  status:'processing'|'ready'|'failed'
  totalChunk:number
  processingError:string | undefined
  uploadedBy:mongoose.Types.ObjectId
  createdBy:mongoose.Types.ObjectId
  updatedBy:mongoose.Types.ObjectId
  isDeleted:boolean
  deletedAt:Date
  createdAt:Date
  updatedAt:Date
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>({
  organization:{
    type:Schema.Types.ObjectId,
    ref:'Organization',
    required:true
  },
  fileName:{type:String , required:true},
  fileUrl:{type:String , required:true},
  fileSize:{type:Number , required:true},
  mimeType:{type:String , required:true},
  status:{
    type:String,
    enum:['processing','ready','failed'],
    default:'processing'
  },
  totalChunk:{type:Number, default:0},
  processingError:{type:String},
  uploadedBy:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
},{
  timestamps:true,
  toJSON:{
    transform(doc , ret){
      const {__v , ...safeJson}  = ret
      return safeJson
    }
  }
})


KnowledgeBaseSchema.plugin(softDeletePlugin)
KnowledgeBaseSchema.plugin(auditPlugin)
KnowledgeBaseSchema.index({ organization: 1, status: 1 })

export default mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema)