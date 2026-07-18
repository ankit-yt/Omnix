import {} from '@/models/base/index.js'
import {} from '@/models/base/types.js'
import ChatSessionRepository from '@/repositories/chatSession.repository.js';
import chunkRepository from '@/repositories/chunk.repository.js';
import messageRepository from '@/repositories/message.repository.js';
import workspaceRepository from '@/repositories/workspace.repository.js'
import aiService from '@/services/ai.service.js';
import AppError from '@/utils/AppError.js';
import { ChatMessageDto } from '@/validators/chat.validator.js';
import { createChatSessionSchema } from '@/validators/chatSession.validator.js';
import mongoose from 'mongoose';

class ChatService{

  private async generateAndSaveTitle(chatSessionId:mongoose.Types.ObjectId , firstMessage:string){
    const prompt = `
      Generate a short, descriptive title (maximum 4 to 5 words) for a chat conversation that starts with the following message.
      Return ONLY the title text. Do not include quotes, preambles, or punctuation at the end.
      
      Message: "${firstMessage}"
    `;

    const aiResponse = await aiService.generateText(prompt);
    let cleanTitle = aiResponse.text.trim();
    cleanTitle = cleanTitle.replace(/^["']|["']$/g, '');

    await ChatSessionRepository.findByIdAndUpdate(chatSessionId.toString() , {title:cleanTitle});
  }

  async processUserMessage(
    organizationId:string,
    dto:ChatMessageDto
  ){
    const workspace = await workspaceRepository.findById(dto.workspaceId);

    if(!workspace){
      throw new AppError('Workspace not found.',404);
    }

    if(workspace.organization.toString() != organizationId){
      throw new AppError('Tenant boundary violation: Workspace does not belong to your organization.',403);
    }

    let activeSessionId: mongoose.Types.ObjectId;

    if(dto.sessionId){
      const existingSesion = await ChatSessionRepository.findById(dto.sessionId);
      if(!existingSesion) throw new AppError('Provided chat session no longer exits.',404);

      activeSessionId = new mongoose.Types.ObjectId(existingSesion._id);
    }else{
      const newSession = await ChatSessionRepository.create( 
      organizationId ,
      dto.workspaceId ,  
      {
      title: "New Conversation",
      page: {
        url: dto.page.url,
        title: dto.page.title,
      },
      client: {
        userAgent:dto.client.userAgent,
      },
    });

      activeSessionId = newSession._id!;
      this.generateAndSaveTitle(activeSessionId , dto.content).catch(err=>{
        console.error(`Failed to generate AI title for session ${activeSessionId}: ${err.message}`)
      })

    }

    await messageRepository.create({
      session:activeSessionId,
      organization:new mongoose.Types.ObjectId(organizationId),
      role:'user',
      content:dto.content,
      metadata:{
        pageUrl:'',screenshotAnalysis:'',sourceChunks:[],
        tokensUsed:0,responseTime:0,modelUsed:'',retrievalScore:0
      }
    });

    const startTime = Date.now();

    const queryVector = await aiService.generateEmbedding(dto.content,'RETRIEVAL_QUERY');
    const similarChunks = await chunkRepository.findSimilarChunks(dto.workspaceId, queryVector,5);

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
     ${dto.content}
     `;

     const aiResponse = await aiService.generateText(prompt);

     answer = aiResponse.text;
     tokenUsed = aiResponse.tokenCount;
     sourceChunkIds = similarChunks.map(chunk=>new mongoose.Types.ObjectId(chunk._id));
    }
    const responseTimeMs = Date.now()-startTime;

    const aiMessage = await messageRepository.create({
      session:activeSessionId,
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
      sessionId: activeSessionId,
      answer:answer,
      sourcesUsed:sourceChunkIds.length
    }
  }
}

export default new ChatService();