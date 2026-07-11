import { IPlan, IPromotion } from '@/models/base/types.js';
import planRepository from '@/repositories/plan.repository.js';
import promotionRepository from '@/repositories/promotion.repository.js';
import AppError from '@/utils/AppError.js';
import mongoose from 'mongoose';
class AdminService{

  async createPlan(adminUserId:string,planData:Partial<IPlan>){
    const existingPlan = await planRepository.findByCode(planData.code!);
    if(existingPlan){
      throw new AppError(`A plan with the code '${planData.code}' already exists.`,400)
    }

    const newPlan = await planRepository.create({
      ...planData,
      createdBy: new mongoose.Types.ObjectId(adminUserId)
    });

    return newPlan;
  }

  async createPromotion(adminUserId:string, promoData:Partial<IPromotion>){
    if(!promoData.validFrom || !promoData.validUntil){
      throw new AppError('Please enter both validFrom as well as validUntil.',400)
    }
    const validFrom = new Date(promoData.validFrom);
    const validUntil = new Date(promoData.validUntil);

    if(validUntil <= validFrom){
      throw new AppError('The validUntil date must be after the validFrom date.',400);
    }

    if(promoData.discountPercentage! <1 || promoData.discountPercentage! > 100){
      throw new AppError('Discount percentage must be between 1 and 100.',400);
    }

    if(!promoData.applicablePlans || promoData.applicablePlans.length === 0){
      throw new AppError('You must specify at least one Plan ID this promotion applies to.',400);
    }

    const applicablePlans = promoData.applicablePlans;

    const newPromotion = await promotionRepository.create({
      name:promoData.name,
      discountPercentage:promoData.discountPercentage,
      applicablePlans:applicablePlans,
      validFrom,
      validUntil,
      createdBy: new mongoose.Types.ObjectId(adminUserId)
    })

    return newPromotion;
  }
}

export default new AdminService();