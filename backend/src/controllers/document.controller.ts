import documentService from "@/services/document.service.js";
import AppError from "@/utils/AppError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request , Response} from 'express';
import { PDFParse } from 'pdf-parse';


export const uploadAndProcessDocument = asyncHandler(async(req:Request , res:Response)=>{


  const{workspaceId} = req.body;
  const file = req.file;

  
  const organizationId = req.user?.organization?.toString();
  const userId = req.user?._id?.toString();

  if(!workspaceId ){
    throw new AppError('Missing required fields: workspaceId.',400);
  }

  if(!file){
    throw new AppError('No document file provided.',400);
  }

  if(!organizationId || !userId){
    throw new AppError('Unauthorized: User token context missing',401);
  }

  let rawText = "";
  try{
    if(file.mimetype === 'application/pdf'){
      const parser = new PDFParse({
    data: file.buffer
    });
    const result = await parser.getText();
      rawText = result.text;
    }else{
      rawText = file.buffer.toString('utf-8')
    }
    }catch(err){
      throw new AppError('Failed to extract text from the provided document.',422);
    }

    if (!rawText.trim()) {
    throw new AppError('The uploaded document contains no readable text.', 422);
  }

  const newDocument = await documentService.processDocument(
    workspaceId,
    organizationId,
    userId,
    file.buffer,
    rawText,
    file.originalname, 
    file.mimetype,     
    file.size
  );

  res.status(202).json({
    status:'success',
    message:'Document accepted. Vector chunking and embedding processing has started in the background.',
    data:{
      documentId:newDocument._id
    }
  })

})

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organization?.toString();
  const workspaceId = req.query.workspaceId as string; 

  if (!organizationId) {
    throw new AppError('Unauthorized: User token context missing', 401);
  }

  const documents = await documentService.getDocuments(organizationId, workspaceId);

  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: { documents } 
  });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const organizationId = req.user?.organization?.toString();

  if (!organizationId) {
    throw new AppError('Unauthorized: User token context missing', 401);
  }

  // This will throw if the download fails, preventing the DB deletion
  const { buffer, fileName, mimeType } = await documentService.deleteAndRetrieveDocument(
    documentId as string, 
    organizationId
  ); 

  // Send the file back as an attachment
  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  
  res.status(200).send(buffer);
});