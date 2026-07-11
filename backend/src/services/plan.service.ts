import {} from '@/models/base/index.js'
import { IPlan } from '@/models/base/types.js'
import planRepository from '@/repositories/plan.repository.js'
import promotionRepository from '@/repositories/promotion.repository.js';
import AppError from '@/utils/AppError.js';

class PlanService{
  
  async getAvailablePlans():Promise<IPlan[]>{
    const plans = await planRepository.findAllActive();

    if(!plans || plans.length === 0){
      throw new AppError('No subscription plans are currently configured in the system.',500)
    }

    const plansWithPricing = await Promise.all(plans.map(async(plan)=>{
      const activePromo = await promotionRepository.findBestActiveForPlan(plan._id!.toString());
      
      let salePriceInPaise = null;
      let appliedPromtion = null;

      if(activePromo){
        const discountAmount = Math.floor((plan.priceInPaise *  activePromo.discountPercentage)/100);
        salePriceInPaise = Math.max(0,plan.priceInPaise - discountAmount);

        appliedPromtion = {
          id:activePromo._id,
          name:activePromo.name,
          discountAmount: activePromo.discountPercentage,
          validUntil:activePromo.validUntil
        }
      }

      return {
        ...plan,
        pricing:{
          originalPriceInPaise: plan.priceInPaise,
          salePriceInPaise : salePriceInPaise,
          isDiscounted: !!activePromo,
          promotionDetails:appliedPromtion
        }
      }
    }))

    return plansWithPricing;
  }

  async getPlanByCode(code:string):Promise<IPlan>{
    if(!code){
      throw new AppError('Plan code parameter is missing.',400);
    }

    const plan = await planRepository.findByCode(code);
    if(!plan){
      throw new AppError(`Plan tier identified by code "${code}" could not be found.`,404);
    }

    return plan;
  }

}

export default new PlanService();
