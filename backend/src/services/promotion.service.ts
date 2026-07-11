import promotionRepository from "@/repositories/promotion.repository.js";
import AppError from "@/utils/AppError.js";
import { Promotion } from '@/models/base/index.js';
import { IPromotion, IPromotionDoc } from '@/models/base/types.js';

interface DiscountCalculationResult{
  discountAmountInPaise:number;
  finalAmountInPaise:number;
  promotionId:string;
}

class PromotionService{

  async create(data:Partial<IPromotion>):Promise<IPromotionDoc>{
    return await Promotion.create(data);
  }
}

export default new PromotionService();