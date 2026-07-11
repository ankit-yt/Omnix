
import { auditPlugin, softDeletePlugin } from "@/models/base/plugins.js";
import { IAudit, ISoftDelete } from "@/models/base/types.js";
import mongoose, { Document, mongo } from "mongoose";
import { Schema } from "mongoose";

export interface IPlan extends ISoftDelete , IAudit{
  _id?:mongoose.Types.ObjectId;
  code:string;
  displayName:string;
  description:string;
  priceInPaise:number;
  currency:string; 
  sortOrder:number;
  limits:{
    messagesPerMonth:number;
    knowledgeBaseSizeMB : number;
    teamMembers:number;
    maxWorkspaces: number;
  };
  features:string[];
  createdAt:Date;
  updatedAt:Date;
  
}

export interface IPlanDoc extends Omit<IPlan, '_id'> , Document {};

const PlanSchema = new Schema<IPlanDoc>({
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
  description:{
    type:String,
    default:"",
    trim:true
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
    messagesPerMonth:{
      type:Number,
      required:true
    },
    knowledgeBaseSizeMB:{
      type:Number,
      required:true
    },
    teamMembers:{
      type:Number,
      required:true
    },
    maxWorkspaces: {
      type: Number,
      required: true
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

export default mongoose.model<IPlanDoc>('Plan', PlanSchema)