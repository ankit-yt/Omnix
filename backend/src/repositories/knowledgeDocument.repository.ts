import { KnowledgedDocument } from '@/models/base/index.js'
import { IKnowledgeDocument, IKnowledgeDocumentDoc } from '@/models/base/types.js'
import mongoose, { ClientSession } from 'mongoose';
class knowledgeDocumentRepository {

  async create(data: Partial<IKnowledgeDocument> , session?:ClientSession): Promise<IKnowledgeDocumentDoc> {
   const [knowledgeDocument] = await KnowledgedDocument.create(
    [data],
    { session }
  );

  return knowledgeDocument; }

  async findById(id: string): Promise<IKnowledgeDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await KnowledgedDocument.findById(id);
  }

  async updateStatus(id: string, updateData: {
    status: 'processing' | 'ready' | 'failed';
    totalChunks?: number;
    processingError?: string | null;
    processedAt?: Date
  }, session?: ClientSession): Promise<IKnowledgeDocument | null> {
    return await KnowledgedDocument.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true, session }
    )
  }

  async findByWorkspace(workspaceId: string): Promise<IKnowledgeDocument[]> {
    return await KnowledgedDocument.find({
      workspace: new mongoose.Types.ObjectId(workspaceId),
      isDeleted: false
    }).sort({ createdAt: -1 }).lean()
  }

  async softDelete(id: string, deletedByUserId: string): Promise<boolean> {
    const result = await KnowledgedDocument.updateOne({
      _id: new mongoose.Types.ObjectId(id)
    },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(deletedByUserId)
        }
      })
    return result.modifiedCount > 0;
  }

  async delete(id:string , session?:ClientSession):Promise<void>{
    await KnowledgedDocument.findByIdAndDelete(id, {session});
  }

  async restore(id: string, restoreByUserId: string): Promise<boolean> {
    const result = await KnowledgedDocument.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          updatedBy: new mongoose.Types.ObjectId(restoreByUserId)
        }
      },
      {
        returnDocument: 'after',
        includeDeleted: true
      }
    )
    return result != null;
  }

  async findByOrganization(organizationId:string , workspaceId?:string){
    const query = {organization:organizationId};


    return await KnowledgedDocument.find(query).sort({createdAt:-1})
  }

}

export default new knowledgeDocumentRepository();