import AppError from '@/utils/AppError.js';
import { Content, GoogleGenerativeAI, TaskType } from '@google/generative-ai';

class AIService{
  private genAI:GoogleGenerativeAI;

  constructor(){
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('CRITICAL SYSTEM HALT: GEMINI_API_KEY is not defined in environment variables.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateEmbedding(text:string, taskType:'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'):Promise<number[]>{
   try{
     const model = this.genAI.getGenerativeModel({model:'text-embedding-004'});

    const mappedTaskType = taskType === 'RETRIEVAL_DOCUMENT'
      ? TaskType.RETRIEVAL_DOCUMENT
      : TaskType.RETRIEVAL_QUERY

    const formattedContent:Content = {
      role:'user',
      parts:[{text}]
    };
    const result = await model.embedContent({
      content:formattedContent,
      taskType:mappedTaskType
    });

    return result.embedding.values;
   }catch(error:any){
    console.log(`[AI_SERVICE_ERROR] Embedding generation failed.`,error);
    throw new AppError(`Ai Embedding failed: ${error.message}.`,502);
   }
  }

  async generateText(prompt:string):Promise<{text :string;tokenCount:number}>{
    try{
      const model = this.genAI.getGenerativeModel({
        model:'gemini-1.5-flash',
        generationConfig:{
          temperature:0.1
        }
      });

      const result = await model.generateContent({
        contents:[{role:'user',parts:[{text:prompt}]}]
      });

      const response = await result.response;
      const tokenCount = response.usageMetadata?.totalTokenCount || 0;

      return {
        text:response.text(),
        tokenCount
      };

    }catch(error:any){
     console.error('[AI_SERVICE_ERROR] Text generation failed:', error);
      throw new AppError(`AI Generation failed: ${error.message}`, 502);
    }
  }
}


export default new AIService();