import { Plan } from '@/models/base/index.js';
import { IPlanDoc } from '@/models/base/types.js';

class PlanRepository{

  async findByCode(code:string):Promise<IPlanDoc | null>{
    return Plan.findOne({code}).lean();
  }
}

export default new PlanRepository();