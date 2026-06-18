import mongoose, { Document, Schema } from "mongoose";
import crypto from 'crypto'
import { softDeletePlugin } from "@/models/base/plugins.js";
export interface IOrganization extends Document {
  name:string;
  slug:string;
  isSlugCustomized:boolean;
  website:string;
  logoUrl:string | null;
  contactEmail:string;
  apiKey:string
  apiKeyPrefix:string
  cachedPlan:'free' | 'pro' | 'enterprise'
  isActive:boolean
  cachedUsage:{
    messagesThisMonth:number
    totalMessages:number
    lastResetDate:Date
  }
  cachedLimits:{
    messagesPerMonth:number;
    knowledgeBaseSizeMB:number;
    teamMembers:number;
    maxWorkspaces:number;
  }
  subscription:{
    activeSubscriptionId: mongoose.Types.ObjectId | null;
    status:'trial' | 'active' | 'cancelled' | 'past_due' | 'expired';
    trialEndsAt:Date;
    currentPeriodEnd:Date | null;
    razorpayCustomerId:string;
    razorpaySubscriptionId:string;
  };
  onboardingStatus:{
    slugConfigured:boolean;
    workspaceCreated:boolean;
    knowledgeBaseUploaded:boolean;
    firstSuccessfulMessage:boolean;
    completedAt:Date | null;
  }
  createdBy:mongoose.Types.ObjectId | null
  createdAt: Date
  isDeleted:boolean
  deletedAt:Date
  updatedAt:Date

  generateNewApiKey():Promise<string>
}

const OrganizationSchema = new Schema<IOrganization>({
  name:{
    type:String,
    required:[true,'Organization name is required'],
    trim:true,
    maxLength:[100,"Name cannot exceed 100 characters"]
  },
  slug:{
    type:String,
    unique:true,
    required:true,
    lowercase:true,
    trim:true
  },
  isSlugCustomized:{
    type:Boolean,
    default:false
  },
  website:{
    type:String,
    required:[true,'website is required'],
    lowercase:true,
    trim:true
  },
  logoUrl:{
    type:String,
    default:null
  },
  contactEmail:{
    type:String,
    required:[true , 'Contact email is required'],
    trim:true,
    lowercase:true,
  },
  apiKey:{
    type:String,
    unique:true,
    select:false
  },
  apiKeyPrefix:{
    type:String,
    default:''
  },
  cachedPlan:{
    type:String,
    enum:['free','pro','enterprise'],
    default:'free'
  },
  isActive:{
    type:Boolean,
    default:true,
  },
  cachedUsage:{
    messagesThisMonth:{type:Number,default:0},
    totalMessages:{type:Number,default:0},
    lastResetDate:{type:Date, default:Date.now},
  },
  cachedLimits:{
    messagesPerMonth:{type:Number,default:100},
    knowledgeBaseSizeMB: { type: Number, default: 10 },
    teamMembers: { type: Number, default: 1 },
    maxWorkspaces:{type:Number,default:1},
  },
  subscription:{
    activeSubscriptionId:{
      type:Schema.Types.ObjectId,
      ref:'Subscription',
      default:null
    },
    status:{
      type:String,
      enum:['trial','active','cancelled','past_due','expired'],
      default:'trial'
    },
    trialEndsAt:{
      type:Date,
      default:()=>new Date(Date.now()+14*24*60*60*1000),
    },
    currentPeriodEnd:{
      type:Date,
      default:null
    },
    razorpayCustomerId:{
      type:String,
      default:''
    },
    razorpaySubscriptionId:{
      type:String,
      default:''
    },
  },
  onboardingStatus:{
    slugConfigured:{type:Boolean , default:false},
    workspaceCreated:{type:Boolean , default:false},
    knowledgeBaseUploaded:{type:Boolean , default:false},
    firstSuccessfulMessage:{type:Boolean , default:false},
    completedAt:{type:Date , default:null}
  },
  createdBy:{
    type:Schema.Types.ObjectId,
    ref:"User",
    default:null
  },


},{
  timestamps:true,
  toJSON:{
    transform(doc,ret){
      const {apiKey , __v , ...saftObject} = ret
      return saftObject
    }
  }
})

OrganizationSchema.methods.generateNewApiKey = async function(){
  const key = `erpg_${crypto.randomBytes(32).toString('hex')}`
  this.apiKey = key
  this.apiKeyPrefix = key.substring(0,12)+'...'
  return key
}

OrganizationSchema.plugin(softDeletePlugin)
OrganizationSchema.index({website:1})

export default mongoose.model<IOrganization>('Organization',OrganizationSchema)