import { Plan } from '@/models/base/index.js';
import { IPlan, IPlanDoc } from '@/models/base/types.js';

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
  
}

export default new PlanRepository();