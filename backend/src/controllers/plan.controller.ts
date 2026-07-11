import planService from "@/services/plan.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Response , Request}  from 'express';

export const getAllPlans = asyncHandler(async(req:Request , res:Response)=>{
  const plans = await planService.getAvailablePlans();
  
  res.status(200).json({
    status:'success',
    results:plans.length,
    data:{plans}
  })

  
})

export const getPlanDetails = asyncHandler(async(req:Request , res:Response)=>{
    const {code} = req.params;

    if(typeof code != "string"){
      throw new AppError('Invalid plan code',400);
    }
    const plan = await planService.getPlanByCode(code);

    res.status(200).json({
      status:'success',
      data:{plan}
    })
  })