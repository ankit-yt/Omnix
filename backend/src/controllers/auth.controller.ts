import authService from "@/services/auth.service.js";
import { RegisterInput } from "@/types/auth.types.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request , Response} from 'express';

export const register = asyncHandler(async(req:Request, res:Response)=>{
  const input:RegisterInput = req.body;
  console.log(input);
  const result = await authService.register(input, res);
console.log(result);
  res.status(201).json({
    status:'success',
    message:'Registration successful',
    accessToken:result.accessToken,
    data:result.data,
  })
})

export const login = asyncHandler(async(req:Request, res:Response)=>{
  console.log("hit login")
  const {email, password} = req.body;

  if(!email || !password){
    throw new AppError('Please provide both email and password.',400)
  }

  const result = await authService.login(email,password,res);

  res.status(203).json({
    status:'success',
    message:'Login successful',
    accessToken : result.accessToken,
    data:result.data
  })
})

export const refresh = asyncHandler(async(req:Request,res:Response)=>{
  const token = req.cookies?.refreshToken;

  const result = await authService.refresh(token);

  res.status(200).json({
    status:'success',
    accessToken:result.accessToken
  })
})

export const logout = asyncHandler(async(req:Request , res:Response)=>{
  const token = req.cookies?.refreshToken;

  await authService.logout(token,res);

  res.status(200).json({
    status:'success',
    message:'Logged out successfully'
  })
})

export const getMe = asyncHandler(async(req:Request,res:Response)=>{
  const userId  = req.user?._id?.toString();

  if(!userId){
    throw new AppError('Not authenticated.',401);
  }

  const result = await authService.getMe(userId);

  res.status(200).json({
    status:'success',
    data:result.user
  })
})