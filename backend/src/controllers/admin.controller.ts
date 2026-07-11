import adminService from "@/services/admin.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request , Response} from 'express';

export const createPlan = asyncHandler(async(req:Request , res:Response)=>{
  const adminId = req.user?._id?.toString();

  if(!adminId) throw new AppError('Unauthorized: Admin context missing.',401);

  const {code, displayName , priceInPaise , limits} = req.body;
  if(!code || !displayName || priceInPaise === undefined || !limits){
    throw new AppError('Missing required plan fields: code , displayName , priceInPaise , or limits.',400);
  }

  const plan = await adminService.createPlan(adminId, req.body);

  res.status(201).json({
    status:'success',
    message:'New subscription plan created successfully.',
    data:{plan}
  });
});


export const createPromotion = asyncHandler(async(req:Request , res:Response)=>{
  const adminId = req.user?._id?.tostring();

  if(!adminId) throw new AppError('Unauthorized: Admin context missing.',401);

  const { name , discountPercentage , applicablePlans , validFrom , validUntil} = req.body;

  if(!name || !discountPercentage || !applicablePlans || !validFrom || !validUntil){
    throw new AppError('Missing required promotions fields.',400);
  }

  const promotion = await adminService.createPromotion(adminId , req.body);

  res.status(201).json({
    status:'success',
    message:'Global promotion launched successfully',
    data:{promotion}
  });
});