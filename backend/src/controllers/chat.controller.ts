import chatService from "@/services/chat.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import { Request , Response} from "express";

export const handleUserMessage = asyncHandler(async(req:Request ,res:Response)=>{
  const {workspaceId , sessionId , content} = req.body;
  const organizationId = req.user?.organization?.toString();

  if(!workspaceId || !sessionId || !content){
    throw new AppError('Missing required fields: workspaceId, sessionId, or content',400);
  }

  if(!organizationId){
    throw new AppError('Unauthorized: User context missing',401);
  }

  const result = await chatService.processUserMessage(
    workspaceId,
    organizationId,
    sessionId,
    content
  );

  res.status(200).json({
    status:'success',
    data:result
  })
})