import mongoose, { Document, Schema } from "mongoose";
import crypto from 'crypto'
import { softDeletePlugin } from "@/models/base/softDelete";
export interface IOrganization extends Document {
  name:string
  domain:string
  apiKey:string
  apiPrefix:string
  plan:'free' | 'pro' | 'enterprise'
  isActive:boolean
  setting:{
    botName:string
    PrimaryColor:string
    WelcomeMessage:string
  }
  usage:{
    messageThisMonth:number
    totalMessage:number
    lastResetDate:Date
  }
  subscription:{
    status:'trial' | 'active' | 'cancelled' | 'past_due'
    trialEndsAt:Date
    currentPeriodEnd:Date
  }
  createdBy:mongoose.Types.ObjectId
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
  domain:{
    type:String,
    required:[true,'Doamin is required'],
    unique:true,
    lowercase:true,
    trim:true
  },
  apiKey:{
    type:String,
    unique:true,
    select:false
  },
  apiPrefix:{
    type:String,
  },
  plan:{
    type:String,
    enum:['free','pro','enterprise'],
    default:'free'
  },
  isActive:{
    type:Boolean,
    default:true,
  },
  setting:{
    botName:{
      type:String,
      default:'Erp Assistant'
    },
    PrimaryColor:{
      type:String,
      default:'#6366f1'
    },
    WelcomeMessage:{
      type:String,
      Default:'Hi! How i can help you today?'
    }
  },
  usage:{
    messageThisMonth:{type:Number,default:0},
    totalMessage:{type:Number,default:0},
    lastResetDate:{type:Date, default:Date.now}
  },
  subscription:{
    status:{
      type:String,
      enum:['trial','active','cancelled','past_due'],
      default:'trial'
    },
    trialEndsAt:{
      type:Date,
      default:()=>new Date(Date.now()+14*24*60*60*1000),
    },
    currentPeriodEnd:{
      type:Date
    }
  },
  createdBy:{
    type:Schema.Types.ObjectId,
    ref:"User"
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
  this.apiPrefix = key.substring(0,12)+'...'
}

OrganizationSchema.plugin(softDeletePlugin)
OrganizationSchema.index({apiKey:1})
OrganizationSchema.index({domain:1})

export default mongoose.model<IOrganization>('Organization',OrganizationSchema)