import knowledgeDocumentRepository from "@/repositories/knowledgeDocument.repository.js";
import organizationRepository from "@/repositories/organization.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js"
import AppError from "@/utils/AppError.js";
import mongoose from "mongoose";
import {IChunk} from '@/models/base/types.js'
import chunkRepository from "@/repositories/chunk.repository.js";
import aiService from "@/services/ai.service.js";

class DocumentService{

  private generateChunks(text:string,chunkSize:number,overlap:number):string[]{
    const words = text.split(/\s+/);
    const chunks:string[] = [];

    if(words.length === 0) return chunks;

    let i = 0;
    while(i < words.length){
      const chunk = words.slice(i,i+chunkSize).join(' ');
      chunks.push(chunk);
      i += (chunkSize - overlap);
    }

    return chunks;
  }

  private async _processDocument(
    documentId:string,
    workspaceId:string,
    organizationId:string,
    rawText:string,
  ):Promise<void>{
     const chunkPayLoads:IChunk[] = [];
    try{
      const textChunks = this.generateChunks(rawText,500,100);

      if(textChunks.length === 0){
        throw new Error('Document contains no extractable text.');
      }

     

      for(let i = 0 ; i<textChunks.length ; i++){
        const content = textChunks[i];

        const embedding = await aiService.generateEmbedding(content,'RETRIEVAL_DOCUMENT');

        chunkPayLoads.push({
          knowledgeDocument:new mongoose.Types.ObjectId(documentId),
          workspace:new mongoose.Types.ObjectId(workspaceId),
          organization:new mongoose.Types.ObjectId(organizationId),
          content,
          embedding,
          chunkIndex:i
        })
      }

   
    }catch(error:any){
      await knowledgeDocumentRepository.updateStatus(documentId,{
        status:'failed',
        processingError:`AI Processing failed: ${error.message}`
      })
      return;
    }

    const session = await mongoose.startSession();
    try{
      await session.withTransaction(async()=>{
        await chunkRepository.createMany(chunkPayLoads,session);

        await knowledgeDocumentRepository.updateStatus(
          documentId,
          {
            status:'ready',
            totalChunks:chunkPayLoads.length,
            processedAt:new Date()
          },
          session
        );
      })
    }catch(dbError:any){
      console.log(`[CRITICAL DB ERROR] Document ${documentId} rollback initiated:`,dbError);

      await knowledgeDocumentRepository.updateStatus(documentId,{
        status:'failed',
        processingError:'Database synchronization failed during final save.'
      });
    }finally{
      await session.endSession();
    }
  }

  async processDocument(
    workspaceId:string,
    organizationId:string,
    userId:string,
    rawText:string,
    fileName:string,
    mimeType:string = 'text/plain',
    fileSizeByte?:number){
      const sizeInBytes = fileSizeByte || Buffer.byteLength(rawText,'utf8')

      const workspace = await workspaceRepository.findById(workspaceId);
      
      if(!workspace){
        throw new AppError('Workspace not found.',404);
      }

      if(!workspace.isActive){
        throw new AppError('Workspace is archived or inactive. Cannot upload documents.',400);
      }

      const organization = await organizationRepository.findById(organizationId);
      
      if(!organization || !organization.cachedLimits){
        throw new AppError('System error: Billing limits not configured for this organization.',500);
      }

      const uploadSizeMB = sizeInBytes /(1024*1024);
      const maxAllowedMB = organization.cachedLimits.knowledgeBaseSizeMB;

      if(uploadSizeMB > maxAllowedMB){
        throw new AppError(`Upload exceeds plan limits. Maximum allowed is ${maxAllowedMB} MB.`,429);
      }

      const document  = await knowledgeDocumentRepository.create({
        organization:new mongoose.Types.ObjectId(organizationId),
        workspace:new mongoose.Types.ObjectId(workspaceId),
        uploadedBy:new mongoose.Types.ObjectId(userId),
        originalFileName:fileName,
        fileName:fileName,
        fileUrl:'raw-text-upload',
        fileSizeByte:sizeInBytes,
        mimeType:mimeType,
        status:'processing'
      });

      this._processDocument(document._id.toString(),workspaceId,organizationId,rawText)
        .catch(err=>console.error(`[CRITICAL] Background worker failed for document ${document._id}:`,err));

      return document;


    }

}

export default new DocumentService();