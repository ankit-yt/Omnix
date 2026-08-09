import knowledgeDocumentRepository from "@/repositories/knowledgeDocument.repository.js";
import organizationRepository from "@/repositories/organization.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js"
import AppError from "@/utils/AppError.js";
import mongoose from "mongoose";
import { IChunk, IKnowledgeDocumentDoc } from '@/models/base/types.js'
import chunkRepository from "@/repositories/chunk.repository.js";
import aiService from "@/services/ai.service.js";
import { logger } from '@/utils/logger.js';
import { storageService } from "@/services/storage.service.js";
import { SourceType } from "@/models/Message.js";
import { buffer } from "node:stream/consumers";

class DocumentService {

  private generateChunks(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    if (words.length === 0) return chunks;

    let i = 0;
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
      i += (chunkSize - overlap);
    }

    return chunks;
  }

  private async _processDocument(
    documentId: string,
    workspaceId: string,
    organizationId: string,
    rawText: string,
  ): Promise<void> {
    const chunkPayLoads: IChunk[] = [];
    try {
      const textChunks = this.generateChunks(rawText, 500, 100);

      if (textChunks.length === 0) {
        throw new Error('Document contains no extractable text.');
      }



      for (let i = 0; i < textChunks.length; i++) {
        const content = textChunks[i];

        const embedding = await aiService.generateEmbedding(content, 'RETRIEVAL_DOCUMENT');

        chunkPayLoads.push({
          knowledgeDocument: new mongoose.Types.ObjectId(documentId),
          workspace: new mongoose.Types.ObjectId(workspaceId),
          organization: new mongoose.Types.ObjectId(organizationId),
          content,
          embedding,
          chunkIndex: i
        })
      }


    } catch (error: any) {
      logger.error(`[AI_PROCESSING_ERROR] Document ${documentId} failed:`, error.message);

      await knowledgeDocumentRepository.updateStatus(documentId, {
        status: 'failed',
        processingError: `AI Processing failed: ${error.message}`
      })
      return;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await chunkRepository.createMany(chunkPayLoads, session);

        await knowledgeDocumentRepository.updateStatus(
          documentId,
          {
            status: 'ready',
            totalChunks: chunkPayLoads.length,
            processedAt: new Date()
          },
          session
        );
        let organization = await organizationRepository.findById(organizationId);
        if (organization?.onboardingStatus && !organization.onboardingStatus.knowledgeBaseUploaded) { }
        await organizationRepository.updateOnboardingStep(
          organizationId,
          'knowledgeBaseUploaded',
          session
        );
      })
    } catch (dbError: any) {
      logger.error(`[CRITICAL_DB_ERROR] Document ${documentId} rollback initiated:`, dbError);

      await knowledgeDocumentRepository.updateStatus(documentId, {
        status: 'failed',
        processingError: 'Database synchronization failed during final save.'
      });
    } finally {
      await session.endSession();
    }
  }

  async processDocument(
    workspaceId: string,
    organizationId: string,
    userId: string,
    fileBuffer: Buffer,
    rawText: string,
    fileName: string,
    mimeType: string = 'text/plain',
    sourceType: SourceType,
    fileSizeByte?: number
  ): Promise<IKnowledgeDocumentDoc> {

    const sizeInBytes = fileSizeByte || Buffer.byteLength(rawText, 'utf8');
    const uploadSizeMB = sizeInBytes / (1024 * 1024);

    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    if (!workspace.isActive) {
      throw new AppError(
        'Workspace is archived or inactive. Cannot upload documents.',
        400
      );
    }

    const organization = await organizationRepository.findById(organizationId);

    if (!organization || !organization.cachedLimits) {
      throw new AppError(
        'System error: Billing limits not configured for this organization.',
        500
      );
    }

    const currentUsageMB =
      organization.cachedUsage.usedKnowledgeBaseSizeMB || 0;

    const maxAllowedMB =
      organization.cachedLimits.knowledgeBaseSizeMB;

    if (currentUsageMB + uploadSizeMB > maxAllowedMB) {
      throw new AppError(
        `Upload exceeds plan limits. Current usage: ${currentUsageMB.toFixed(
          2
        )} MB, Allowed: ${maxAllowedMB} MB.`,
        429
      );
    }

    const { fileUrl, storageKey } = await storageService.uploadDocument(
      fileBuffer,
      fileName,
      workspaceId,
      mimeType
    );

    const session = await mongoose.startSession();
    let document: IKnowledgeDocumentDoc | undefined;

    try {
      await session.withTransaction(async () => {
        document = await knowledgeDocumentRepository.create(
          {
            organization: new mongoose.Types.ObjectId(organizationId),
            workspace: new mongoose.Types.ObjectId(workspaceId),
            uploadedBy: new mongoose.Types.ObjectId(userId),
            originalFileName: fileName,
            title: fileName,
            sourceUrl: fileUrl,
            sourceType,
            storageKey,
            fileSizeByte: sizeInBytes,
            mimeType,
            status: 'processing',
          },
          session
        );

        await organizationRepository.updateDocumentSize(
          organizationId,
          uploadSizeMB,
          session
        )
      });

      if (!document) {
        throw new Error('Document creation failed.');
      }

      this._processDocument(
        document._id.toString(),
        workspaceId,
        organizationId,
        rawText
      ).catch((err) =>
        logger.error(
          `[CRITICAL] Background worker failed for document ${document!._id}:`,
          err
        )
      );

      return document;
    } finally {
      await session.endSession();
    }
  }

  
  async processWebPage(workspaceId: string, organizationId: string, url: string, title: string, rawText: string): Promise<IKnowledgeDocumentDoc> {

    const sizeInBytes = Buffer.byteLength(rawText, 'utf-8');
    const uploadSizeMB = sizeInBytes / (1024 * 1024);

    const organization = await organizationRepository.findById(organizationId);
    if (!organization || !organization.cachedLimits) {
      throw new AppError('System error: Billing limits not configured for this organization.', 500);
    }

    const session = await mongoose.startSession();
    let document:IKnowledgeDocumentDoc | undefined;

    try{
      await session.withTransaction(async()=>{
        document = await knowledgeDocumentRepository.create({
          organization:new mongoose.Types.ObjectId(organizationId),
          workspace: new mongoose.Types.ObjectId(workspaceId),
          title,
          sourceUrl:url,
          sourceType:'webpage',
          mimeType:'text/html',
          status:'processing',
        },session);

        await organizationRepository.updateDocumentSize(
          organizationId,
          uploadSizeMB,
          session
        );
      });

      if(!document) throw new Error('Web page document creation filed');

      this._processDocument(
        document._id.toString(),
        workspaceId,
        organizationId,
        rawText
      ).catch(err=>logger.error(`[CRITICAL] Background worker failed for webpage ${document!._id}:`, err))

      return document;
    }finally{
      await session.endSession();
    }
  }

  async getDocuments(organizationId: string, workspaceId?: string) {
    if (!organizationId) {
      throw new AppError('Organization context missing.', 401);
    }

    const documents = await knowledgeDocumentRepository.findByOrganization(
      organizationId,
      workspaceId
    );

    return documents;
  }


  async deleteAndRetrieveDocument(documentId: string, organizationId: string) {
    const document = await knowledgeDocumentRepository.findById(documentId);

    if (!document || document.organization.toString() != organizationId) {
      throw new AppError('Document not found or unauthorized.', 404);
    }

    const documentSizeMB = (document.fileSizeByte ?? 0) / (1024 * 1024);
    const session = await mongoose.startSession();

    let fileBuffer: Buffer | null = null;
    if (document.sourceType === 'file' && document.storageKey) {
      try {
        fileBuffer = await storageService.downloadDocument(document.storageKey);
      } catch (err) {
        logger.warn(`Could not download S3 file before deletion: ${document.storageKey}`);
      }
    } else {
      fileBuffer = Buffer.from(`System Text Dump: Crawled Webpage from ${document.sourceUrl}`);
    }

    try {
      await session.withTransaction(async () => {
        await chunkRepository.deleteMany(documentId, session);

        await knowledgeDocumentRepository.delete(documentId, session);

        await organizationRepository.updateDocumentSize(organizationId, -Math.abs(documentSizeMB), session)
      })
    } catch (dbError) {
      logger.error(`[CRITICAL_DB_ERROR] Failed to delete document ${documentId}:`, dbError);
      throw new AppError('Database error occurred during deletion.', 500);
    } finally {
      await session.endSession();
    }

  if (document.sourceType === 'file' && document.storageKey) {
      try {
        await storageService.deleteDocument(document.storageKey);
      } catch (storageError) {
        logger.error(`[ORPHAN_FILE_WARNING] Failed to delete ${document.storageKey} from S3.`, storageError);
      }
    }

    return {
      buffer: fileBuffer,
      fileName: document.originalFileName || document.title,
      mimeType: document.mimeType || 'text/plain'
    };
  }

}

export default new DocumentService();