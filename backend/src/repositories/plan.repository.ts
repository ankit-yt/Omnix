import { Plan } from '@/models/base/index.js';
import { IPlan, IPlanDoc } from '@/models/base/types.js';
import {ClientSession} from 'mongoose';

class PlanRepository{

  async findByCode(code:string):Promise<IPlanDoc | null>{
    return Plan.findOne({code}).lean();
  }

  async findById(id:string):Promise<IPlan | null>{
    return await Plan.findById(id).lean();
  }

  async findAllActive():Promise<IPlan[]>{
    return await Plan.find().sort({sortOrder:1}).lean();
  }

  async create(data:Partial<IPlan>):Promise<IPlanDoc>{
    return await Plan.create(data);
  }

  async findByRazorpayPlanId(razorpayPlanId: string): Promise<IPlanDoc | null> {
    return Plan.findOne({ razorpayPlanId }).lean();
  }

  async updateRazorpayPlanId(planId:string , razorpayPlanId:string , session?:ClientSession):Promise<IPlanDoc | null>{
    return Plan.findByIdAndUpdate(
      planId,
      {
        $set:{
          razorpayPlanId
        }
      },
      {
        new:true,
        runValidators:true,
        session
      }
    )
  }

  
}

export default new PlanRepository();