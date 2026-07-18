import chatService from "@/services/chat.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import { ChatMessageDto } from "@/validators/chat.validator.js";
import { Request , Response} from "express";

export const handleUserMessage = asyncHandler(async(req:Request ,res:Response)=>{
  const organizationId = req.user?.organization?.toString();

  if(!organizationId){
    throw new AppError('Unauthorized: User context missing',401);
  }

  const result = await chatService.processUserMessage(
    organizationId,
    req.body
  );

  res.status(200).json({
    status:'success',
    data:result
  })
})