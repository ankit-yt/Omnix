import {} from '@/models/base/index.js'
import {} from '@/models/base/types.js'
import chunkRepository from '@/repositories/chunk.repository.js';
import messageRepository from '@/repositories/message.repository.js';
import workspaceRepository from '@/repositories/workspace.repository.js'
import aiService from '@/services/ai.service.js';
import AppError from '@/utils/AppError.js';
import mongoose from 'mongoose';

class ChatService{

  async processUserMessage(
    workspaceId:string,
    organizationId:string,
    sessionId:string,
    content:string,
  ){
    const workspace = await workspaceRepository.findById(workspaceId);

    if(!workspace){
      throw new AppError('Workspace not found.',404);
    }

    if(workspace.organization.toString() != organizationId){
      throw new AppError('Tenant boundary violation: Workspace does not belong to your organization.',403);
    }

    await messageRepository.create({
      session:new mongoose.Types.ObjectId(sessionId),
      organization:new mongoose.Types.ObjectId(organizationId),
      role:'user',
      content:content,
      metadata:{
        pageUrl:'',screenshotAnalysis:'',sourceChunks:[],
        tokensUsed:0,responseTime:0,modelUsed:'',retrievalScore:0
      }
    });

    const startTime = Date.now();
    const queryVector = await aiService.generateEmbedding(content,'RETRIEVAL_QUERY');

    const similarChunks = await chunkRepository.findSimilarChunks(workspaceId, queryVector,5);

    let answer =  '';
    let sourceChunkIds: mongoose.Types.ObjectId[] = [];
    let tokenUsed = 0;

    if(!similarChunks || similarChunks.length === 0){
      answer = "I couldn't find any relevant information in the uploaded knowledge base to answer this."
    }else{
      const contextText = similarChunks.map((chunk, index)=>{
        return `[Source ${index + 1}]: ${chunk.content}`
      }).join('\n\n');
    

    const prompt = `
     you are a intelligent, helpful enterprise assistant.
     Use ONLY the provided context below to answer the user's question.
     If the context does not contain the answer, say "I don't have enough information to answer that."
     Do not hallucinate or use outside knowledge.
     
     CONTEXT:
     ${contextText}

     USER QUESTION:
     ${content}
     `;

     const aiResponse = await aiService.generateText(prompt);

     answer = aiResponse.text;
     tokenUsed = aiResponse.tokenCount;
     sourceChunkIds = similarChunks.map(chunk=>new mongoose.Types.ObjectId(chunk._id));
    }
    const responseTimeMs = Date.now()-startTime;

    const aiMessage = await messageRepository.create({
      session:new mongoose.Types.ObjectId(sessionId),
      organization:new mongoose.Types.ObjectId(organizationId),
      role:'assistant',
      content:answer,
      metadata:{
        pageUrl:'',
        screenshotAnalysis:'',
        sourceChunks:sourceChunkIds,
        tokensUsed:tokenUsed,
        responseTime:responseTimeMs,
        modelUsed:'gemini-1.5-flash',
        retrievalScore:similarChunks.length>0 ? 0.9 :0
      }
    });

    return {
      messageId:aiMessage._id,
      answer:answer,
      sourcesUsed:sourceChunkIds.length
    }
  }
}

export default new ChatService();