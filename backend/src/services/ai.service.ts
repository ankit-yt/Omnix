import systemSettingRepository from '@/repositories/systemSetting.repository.js';
import AppError from '@/utils/AppError.js';
import { Content, GoogleGenerativeAI, TaskType } from '@google/generative-ai';

class AIService {
  
  private genAI: GoogleGenerativeAI | null = null;
  private currentApiKey: string | null = null;

  private async initializeAI() {
    const setting = await systemSettingRepository.findByKey('GEMINI_API_KEY');
    const rawKey = setting?.value || process.env.GEMINI_API_KEY;

    if (!rawKey) {
      throw new AppError('CRITICAL SYSTEM HALT: GEMINI_API_KEY is not defined in DB or environment variables.', 500);
    }

    // Aggressively clean the key: convert to string, remove accidental quotes, and trim spaces/newlines
    const apiKey = String(rawKey).replace(/['"]/g, '').trim();

    if (this.currentApiKey !== apiKey) {
      this.currentApiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  
  async generateEmbedding(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'): Promise<number[]> {  
    await this.initializeAI();
    try {
      // Changed to the correct Google embedding model
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-embedding-001' });

      const mappedTaskType = taskType === 'RETRIEVAL_DOCUMENT'
        ? TaskType.RETRIEVAL_DOCUMENT
        : TaskType.RETRIEVAL_QUERY

      const formattedContent: Content = {
        role: 'user',
        parts: [{ text }]
      };
      
      const result = await model.embedContent({
        content: formattedContent,
        taskType: mappedTaskType
      });

      return result.embedding.values;
    } catch (error: any) {
      console.log(`[AI_SERVICE_ERROR] Embedding generation failed.`, error);
      throw new AppError(`Ai Embedding failed: ${error.message}.`, 502);
    }
  }

  async generateText(prompt: string): Promise<{ text: string; tokenCount: number }> {
    await this.initializeAI();
    try {
      const model = this.genAI!.getGenerativeModel({
        model: 'gemini-flash-latest', // Updated to standard 1.5 flash naming convention just in case
        generationConfig: {
          temperature: 0.1
        }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const response = await result.response;
      const tokenCount = response.usageMetadata?.totalTokenCount || 0;

      return {
        text: response.text(),
        tokenCount
      };

    } catch (error: any) {
      console.error('[AI_SERVICE_ERROR] Text generation failed:', error);
      throw new AppError(`AI Generation failed: ${error.message}`, 502);
    }
  }
}

export default new AIService();