
import { IOrganization } from '@/models/Organization'
import { IUser } from '@/models/User'
import mongoose from 'mongoose';

declare global{
  namespace Express{
    interface Request{
      user?:IUser;
      organization?:mongoose.FlattenMaps<IOrganization> & {_id:mongoose.Types.ObjectId} ;
      resolvedLimits?:{
        messagesPerMonth:number;
        knowledgeBaseSizeMB:number;
        teamMembers:number;
      }
    }
  }
}
