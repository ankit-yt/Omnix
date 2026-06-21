import { auditPlugin, softDeletePlugin } from "@/models/base/plugins.js";
import { IAuditFields } from "@/models/base/types.js";
import mongoose, { Document, Schema } from "mongoose";

export interface IWorkspace extends Document  , IAuditFields{
  organization:mongoose.Types.ObjectId;

  name:string;
  description:string | null;

  avatarUrl:string | null;
  avatarInitials:string;

  allowedDomains:string[];

  settings:{
    botName:string;
    primaryColor:string;
    welcomeMessage:string;
  }

  usage:{
    messagesThisMonth:number;
    totalMessages:number;
  }

  isActive:boolean;


  isDeleted:boolean;

  createdAt:Date;
  updatedAt:Date
}

const WorkspaceSchema = new Schema<IWorkspace>({
  organization:{
    type:Schema.Types.ObjectId,
    ref:'Organization',
    required:[true , 'Organization is required']
  },
  name:{
    type:String,
    required:[true,'Workspace is required'],
    trim:true,
    maxLength:[100,'Workspace name cannot exceed 100 character']
  },
  description:{
    type:String,
    default:null
  },

  avatarUrl:{
    type:String,
    default:null
  },
  avatarInitials:{
    type:String,
    default:''
  },

  allowedDomains:{
    type:[String],
    default:[]
  },

  settings:{
    botName:{
      type:String,
      default:'ERP Assistant'
    },
    primaryColor:{
      type:String,
      default:'#6366f1'
    },
    welcomeMessage:{
      type:String,
      default:'HI! how can I help you today?'
    }
  },
  usage:{
    messagesThisMonth:{type:Number,default:0},
    totalMessages:{type:Number,default:0}
  },

  isActive:{type:Boolean,default:true},

},{
  timestamps:true,
  toJSON:{
    transform(doc,ret){
      const {__v, ...safeJson} = ret;
      return safeJson
    }
  }
})

WorkspaceSchema.pre('save',function(next){
  if((this.isNew || this.isModified('name')) && this.name){
    const words = this.name.trim().split(/\s+/);
    this.avatarInitials = words.slice(0,2).map(word => word.charAt(0).toUpperCase()).join('')
  }
})

WorkspaceSchema.plugin(softDeletePlugin);
WorkspaceSchema.plugin(auditPlugin);

WorkspaceSchema.index({ organization: 1,isDeleted: 1,})
WorkspaceSchema.index({organization: 1,isActive: 1,})
WorkspaceSchema.index({allowedDomains: 1,})

export default mongoose.model<IWorkspace>('Workspace',WorkspaceSchema)