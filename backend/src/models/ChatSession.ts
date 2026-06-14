import { softDeletePlugin } from "@/models/base/plugins";
import mongoose, { Document, Schema } from "mongoose";

export interface IChatSession extends Document{
  organization:mongoose.Types.ObjectId
  sessionId:string
  currentPage:string
  pageTitle:string
  userAgent:string
  conversationSummary:string
  isActive:boolean
  messageCount:number
  totalTokenUsed:number
  lastActivityAt:Date
  isDeleted:boolean
  deletedAt:Date
  createdAt:Date
  updatedAt:Date
}

const ChatSessionSchema = new Schema<IChatSession>({
  organization:{
    type:Schema.Types.ObjectId,
    ref:"Organization",
    required:true
  },
  sessionId:{
    type:String,
    required:true,
    unique:true
  },
  currentPage:{
    type:String,
    required:true
  },
  pageTitle:{
    type:String,
    default:''
  },
  isActive:{
    type:Boolean,
    default:true,
  },
  messageCount:{
    type:Number,
    default:0
  },
  totalTokenUsed:{
    type:Number,
    default:0,
  },
  lastActivityAt:{
    type:Date,
    default:Date.now,
  }
},{
  timestamps:true,
  toJSON:{
    transform(doc, ret){
      const {__v , ...saftJson} = ret
      return saftJson
    }
  }
})

ChatSessionSchema.plugin(softDeletePlugin)
ChatSessionSchema.index({ sessionId: 1 })
ChatSessionSchema.index({ organization: 1, createdAt: -1 })
ChatSessionSchema.index({ lastActivityAt: 1 })

export default mongoose.model<IChatSession>('ChatSession',ChatSessionSchema)
