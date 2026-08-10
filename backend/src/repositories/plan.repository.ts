import { Plan } from '@/models/base/index.js';
import { IPlan, IPlanDoc } from '@/models/base/types.js';
import { updatePlanDto } from '@/validators/admin.validator.js';
import mongoose, { ClientSession } from 'mongoose';

class PlanRepository {

  async findByCode(code: string): Promise<IPlanDoc | null> {
    return Plan.findOne({ code }).lean();
  }

  async findById(id: string): Promise<IPlan | null> {
    return await Plan.findById(id).lean();
  }

  async findAllActive(): Promise<IPlan[]> {
    return await Plan.find({isActive:true}).sort({ sortOrder: 1 }).lean();
  }

  async create(data: Partial<IPlan>): Promise<IPlanDoc> {
    return await Plan.create(data);
  }

  async findByRazorpayPlanId(razorpayPlanId: string): Promise<IPlanDoc | null> {
    return Plan.findOne({ razorpayPlanId }).lean();
  }

  async updateRazorpayPlanId(planId: string, razorpayPlanId: string, session?: ClientSession): Promise<IPlanDoc | null> {
    return Plan.findByIdAndUpdate(
      planId,
      {
        $set: {
          razorpayPlanId
        }
      },
      {
        returnDocument: 'after',
        runValidators: true,
        session
      }
    )
  }

  async findByIdAndUpdate(planId: mongoose.Types.ObjectId, dto: updatePlanDto): Promise<IPlanDoc | null> {
    const setPayload = this.flattenForUpdate(dto as Record<string, any>);

    return Plan.findByIdAndUpdate(
      planId,
      { $set: setPayload },
      { new: true, runValidators: true }
    );
  }


  private flattenForUpdate(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;

      const path = prefix ? `${prefix}.${key}` : key;

      const isPlainObject =
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof mongoose.Types.ObjectId);

      if (isPlainObject) {
        Object.assign(result, this.flattenForUpdate(value, path));
      } else {
        result[path] = value;
      }
    }

    return result;
  }

  async setActiveStatus(planId: mongoose.Types.ObjectId, isActive: boolean): Promise<IPlanDoc | null> {
    return Plan.findByIdAndUpdate(
      planId,
      { $set: { isActive } },
      { new: true, runValidators: true }
    );
  }

  async findAllForAdmin(): Promise<IPlan[]> {
    return await Plan.find().sort({ sortOrder: 1 }).lean();
  }

}

export default new PlanRepository();