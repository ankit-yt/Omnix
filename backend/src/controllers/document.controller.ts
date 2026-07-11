import documentService from "@/services/document.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request , Response} from 'express';


export const uploadAndProcessDocument = asyncHandler(async(req:Request , res:Response)=>{
  const{workspaceId , rawText , fileName, mimeType, fileSizeByte} = req.body;
  
  const organizationId = req.user?.organization?.toString();
  const userId = req.user?._id?.tosString();

  if(!workspaceId || !rawText || !fileName){
    throw new AppError('Missing required fields: workspaceId ,rawText ,or fileName.',400);
  }

  if(!organizationId || !userId){
    throw new AppError('Unauthorized: User token context missing',401);
  }

  const newDocument = await documentService.processDocument(
    workspaceId,
    organizationId,
    userId,
    rawText,
    fileName,
    mimeType,
    fileSizeByte
  );

  res.status(202).json({
    status:'success',
    message:'Document accepted. Vector chunking and embedding processing has started in the background.',
    data:{
      documentId:newDocument._id
    }
  })

})