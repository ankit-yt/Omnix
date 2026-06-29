
import { IOrganization } from '@/models/Organization'
import { IUser } from '@/models/User'
import mongoose from 'mongoose';

declare global{
  namespace Express{
    interface Request{
      user?:IUser;
      organization?:IOrganization;
      resolvedLimits?:IOrganization['cachedLimits'];
    }
  }
}
