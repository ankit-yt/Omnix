import { IPlan, IPromotion } from '@/models/base/types.js';
import organizationRepository from '@/repositories/organization.repository.js';
import planRepository from '@/repositories/plan.repository.js';
import promotionRepository from '@/repositories/promotion.repository.js';
import AppError from '@/utils/AppError.js';
import { logger } from '@/utils/logger.js';
import { updatePlanDto } from '@/validators/admin.validator.js';
import mongoose from 'mongoose';
class AdminService {

  async createPlan(adminUserId: string, planData: Partial<IPlan>) {
    const existingPlan = await planRepository.findByCode(planData.code!);
    if (existingPlan) {
      throw new AppError(`A plan with the code '${planData.code}' already exists.`, 400)
    }

    const newPlan = await planRepository.create({
      ...planData,
      createdBy: new mongoose.Types.ObjectId(adminUserId)
    });

    return newPlan;
  }

  async createPromotion(adminUserId: string, promoData: Partial<IPromotion>) {
    if (!promoData.validFrom || !promoData.validUntil) {
      throw new AppError('Please enter both validFrom as well as validUntil.', 400)
    }
    const validFrom = new Date(promoData.validFrom);
    const validUntil = new Date(promoData.validUntil);

    if (validUntil <= validFrom) {
      throw new AppError('The validUntil date must be after the validFrom date.', 400);
    }

    if (promoData.discountPercentage! < 1 || promoData.discountPercentage! > 100) {
      throw new AppError('Discount percentage must be between 1 and 100.', 400);
    }

    if (!promoData.applicablePlans || promoData.applicablePlans.length === 0) {
      throw new AppError('You must specify at least one Plan ID this promotion applies to.', 400);
    }

    const applicablePlans = promoData.applicablePlans;

    const newPromotion = await promotionRepository.create({
      name: promoData.name,
      discountPercentage: promoData.discountPercentage,
      applicablePlans: applicablePlans,
      validFrom,
      validUntil,
      createdBy: new mongoose.Types.ObjectId(adminUserId)
    })

    return newPromotion;
  }

  async linkRazorpayPlan(adminUserId: string, planCode: string, razorpayPlanId: string) {
    if (planCode.toLowerCase() === 'free') {
      throw new AppError("The Free plan cannot be linked to a external payment gateway.", 400);
    }

    const plan = await planRepository.findByCode(planCode);
    if (!plan) {
      throw new AppError(`Internal plan with code '${planCode}' not found. Run the seeder first.`, 404);
    }

    const updatedPlan = await planRepository.updateRazorpayPlanId(plan._id.toString(), razorpayPlanId);
    return updatedPlan;
  }

  async updatePlan(adminUserId: string, planCode: string, dto: updatePlanDto) {
    const plan = await planRepository.findByCode(planCode);
    if (!plan) {
      throw new AppError(`Plan with code '${planCode}' not found.`, 404);
    }

    if (planCode.toLowerCase() == 'free' && dto.razorpayPlanId) {
      throw new AppError("The Free plan cannot be linked to an external payment gateway.", 400);
    }

    const updatedPlan = await planRepository.findByIdAndUpdate(plan._id, dto);

    if (dto.limits && updatedPlan) {
      const syncedCount = await organizationRepository.syncCachedLimitsForPlan(
        planCode,
        updatedPlan.limits
      );
      logger.info(`Synced cachedLimits to ${syncedCount} organization(s) on plan '${planCode}'.`);
    }
    return updatedPlan;
  }

  async setPlanActiveStatus(adminUserId: string, planCode: string, isActive: boolean) {
    const plan = await planRepository.findByCode(planCode);
    if (!plan) throw new AppError(`Plan with code '${planCode}' not found.`, 404);

    if (planCode.toLowerCase() === 'free' && !isActive) {
      throw new AppError('The Free plan cannot be deactivated.', 400);
    }

    return planRepository.setActiveStatus(plan._id, isActive);
  }

  async getAllPlansForAdmin() {
    return planRepository.findAllForAdmin();
  }

}

export default new AdminService();