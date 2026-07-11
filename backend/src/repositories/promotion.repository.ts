import { Promotion } from '@/models/base/index.js'
import { IPromotion, IPromotionDoc } from '@/models/base/types.js'
import mongoose from 'mongoose';

class PromotionRepository{


  async create(data:Partial<IPromotion>):Promise<IPromotionDoc>{
    return await Promotion.create(data);
  }

  async findActiveByName(name:string,planId:string):Promise<IPromotionDoc | null>{
    const now  = new Date();
    const planObjectId = new mongoose.Types.ObjectId(planId);

    return await Promotion.findOne({
      name:{$regex:new RegExp(`^${name}$`,'i')},
      applicablePlans:planObjectId,
      validFrom:{$lte:now},
      validUntil:{$gte:now}
    });
  }

  async findById(id:string):Promise<IPromotionDoc | null>{
    return await Promotion.findById(id);
  }

  async findBestActiveForPlan(planId:string):Promise<IPromotionDoc | null>{
    const now = new Date();
    return await Promotion.findOne({
      applicablePlans:planId,
      validFrom:{$lte:now},
      validUntil:{$gte:now}
    }).lean();
  }



}



export default new PromotionRepository();