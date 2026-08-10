import adminService from "@/services/admin.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import { Request, Response } from 'express';


export const getAllPlansAdmin = asyncHandler(async (req: Request, res: Response) => {
  const plans = await adminService.getAllPlansForAdmin();
  res.status(200).json({ status: 'success', data: { plans } });
});


export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user?._id?.toString();

  if (!adminId) throw new AppError('Unauthorized: Admin context missing.', 401);

  const { code, displayName, priceInPaise, limits, razorpayPlanId } = req.body;
  if (!code || !displayName || priceInPaise === undefined || !limits) {
    throw new AppError('Missing required plan fields: code , displayName , priceInPaise , or limits.', 400);
  }

  const plan = await adminService.createPlan(adminId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'New subscription plan created successfully.',
    data: { plan }
  });
});


export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user?._id?.toString();

  if (!adminId) throw new AppError('Unauthorized: Admin context missing.', 401);

  const { name, discountPercentage, applicablePlans, validFrom, validUntil } = req.body;

  if (!name || !discountPercentage || !applicablePlans || !validFrom || !validUntil) {
    throw new AppError('Missing required promotions fields.', 400);
  }

  const promotion = await adminService.createPromotion(adminId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Global promotion launched successfully',
    data: { promotion }
  });
});

export const linkRazorpayPlan = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user?._id?.toString();
  if (!adminId) throw new AppError('Unauthorized: Admin context missing.', 401);

  const { code } = req.params;
  const { razorpayPlanId } = req.body;

  if (!razorpayPlanId) {
    throw new AppError('Razorpay Plan ID is required to complete the linkage.', 400);
  }

  const updatedPlan = await adminService.linkRazorpayPlan(adminId, code as string, razorpayPlanId);

  res.status(200).json({
    status: 'success',
    message: `Successfully linked Razorpay ID to the ${code} plan`,
    data: { plan: updatedPlan }
  })

})

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  console.log("helllo")
  const adminId = req.user?._id?.toString();
  if (!adminId) throw new AppError('Unauthorized.', 401);

  const updatePlan = await adminService.updatePlan(adminId, req.params.code as string, req.body);

  res.status(200).json({
    status: 'success',
    data: { plan: updatePlan }
  })
})


export const setPlanActiveStatus = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user?._id?.toString();
  if (!adminId) throw new AppError('Unauthorized: Admin context missing.', 401);

  const { isActive } = req.body;

  const plan = await adminService.setPlanActiveStatus(adminId, req.params.code as string, isActive);

  res.status(200).json({
    status: 'success',
    message: `Plan ${req.params.code} is now ${isActive ? 'active' : 'inactive'}.`,
    data: { plan }
  });
});