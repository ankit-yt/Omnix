import { Subscription } from '@/models/base/index.js'
import { ISubscription, ISubscriptionDoc } from '@/models/base/types.js'
import { ClientSession } from 'mongoose'
import { subscribe } from 'node:diagnostics_channel';

class SubscriptionRepository{

  async create(data:Partial<ISubscription>,session?:ClientSession):Promise<ISubscriptionDoc>{
    const [subscription] = await Subscription.create([data],{session});
    return subscription;
  }

  async findByOrganization(orgId:string):Promise<ISubscription | null>{
    return Subscription.findOne({organization:orgId}).lean();
  }
}

export default new SubscriptionRepository();