import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { logger } from '@/utils/logger.js';

const s3Client = new S3Client({
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID as string,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY as string,
  }
})

export const storageService = {
  uploadDocument: async (
    fileBuffer: Buffer,
    originalName: string,
    workspaceId: string,
    mimeType?: string
  ): Promise<{ fileUrl: string; storageKey: string }> => {
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `workspaces/${workspaceId}/${uniqueId}=${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET_NAME,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: mimeType || 'application/octet-stream',
    })

    try {
      await s3Client.send(command);
    } catch (error: any) {
      logger.error(`[STORAGE_ERROR] Failed to upload ${storageKey}:`, error.message);
      throw error;
    }

    const endpointDomain = process.env.BACKBLAZE_ENDPOINT?.replace('https://', '');
   const fileUrl = `https://${process.env.BACKBLAZE_BUCKET_NAME}.${endpointDomain}/${storageKey}`;
    
    return { fileUrl, storageKey };
  },

  downloadDocument: async (storageKey: string): Promise<Buffer> => {
    const command = new GetObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET_NAME,
      Key: storageKey,
    });

    try {
      const response = await s3Client.send(command);
      const stream = response.Body as NodeJS.ReadableStream;
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error: any) {
      logger.error(`[STORAGE_ERROR] Failed to download ${storageKey}:`, error.message);
      throw error;
    }
  },

  deleteDocument: async (storageKey: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET_NAME,
      Key: storageKey,
    });

    try {
      await s3Client.send(command);
    } catch (error: any) {
      logger.error(`[STORAGE_ERROR] Failed to delete ${storageKey}:`, error.message);
      throw error;
    }
  }


}


