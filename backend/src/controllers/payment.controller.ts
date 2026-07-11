import paymentService from "@/services/payment.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request,Response} from 'express';


export const createCheckout = asyncHandler(async(req:Request,res:Response)=>{
  const {planId} = req.body;
  const organizationId = req.user?.organization?.toString();

  if(!planId) throw new AppError('Target planId is required.',400);
  if(!organizationId) throw new AppError('Unauthorized.',401);

  const checkoutData = await paymentService.createCheckOutSession(organizationId,planId);

  res.status(200).json({
    status:'success',
    data:checkoutData
  });
});


export const handleWebHook = asyncHandler(async (req:Request, res:Response)=>{
  const signature = req.headers['x-razorpay-signature'] as string;

  if(!signature){
    throw new AppError('Missing signature header.',400);
  }

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const result  = await paymentService.processWebHook(rawBody , signature);

  res.status(200).json(result);

})