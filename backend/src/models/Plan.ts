import { auditPlugin, softDeletePlugin } from "@/models/base/plugins";
import mongoose, { Document } from "mongoose";
import { Schema } from "mongoose";

export interface IPlan extends Document{
  code:string;
  displayName:string;
  description:string;
  priceInPaise:number;
  currency:string; 
  sortOrder:number;
  limits:{
    messagePerMonth:number;
    knowledgeBaseSizeMB : number;
    teamMember:number;
  };
  features:string[];
  createdAt:Date;
  updatedAt:Date;
  createdBy:mongoose.Types.ObjectId
  updatedBy:mongoose.Types.ObjectId
  
}

const PlanSchema = new Schema<IPlan>({
  code:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },
  displayName:{
    type:String,
    required:true,
    trim:true,
  },
  priceInPaise:{
    type:Number,
    required:true,
    min:0
  },
  currency:{
    type:String,
    default:'INR'
  },
  sortOrder:{type:Number,default:0},
  limits:{
    messagePerMonth:{
      type:Number,
      required:true
    },
    knowledgeBaseSizeMB:{
      type:Number,
      required:true
    },
    teamMember:{
      type:Number,
      required:true
    }
  },
  features:{
    type:[String],
    default:[]
  },
},{
  timestamps:true,
  toJSON:{
    transform(doc,ret){
      const {__v , ...safeJson} = ret;
      return safeJson
    }
  }
})

PlanSchema.plugin(softDeletePlugin)
PlanSchema.plugin(auditPlugin)

export default mongoose.model<IPlan>('Plan', PlanSchema)