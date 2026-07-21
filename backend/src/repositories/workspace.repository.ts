// src/repositories/workspace.repository.ts
import { ClientSession } from 'mongoose'
import { Workspace } from '@/models/base/index.js'
import { IWorkspace, IWorkspaceDoc } from '@/models/base/types.js'
import mongoose from 'mongoose'
import { UpdateWorkspaceDto } from '@/validators/workspace.validator.js'
class WorkspaceRepository {

  async create(data: Partial<IWorkspace>, session?: ClientSession): Promise<IWorkspaceDoc> {
    const [workspace] = await Workspace.create([data], { session })
    return workspace
  }

  async findByOrganization(orgId: string): Promise<IWorkspace[]> {
    return Workspace.find({ organization: orgId }).lean()
  }

  async findById(workspaceId: string): Promise<IWorkspace | null> {
    return Workspace.findById(workspaceId).lean()
  }

  async findByIdToUpdate(workspaceId: string): Promise<IWorkspaceDoc | null> {
    return Workspace.findById(workspaceId)
  }

  async findByIdAndUpdate(workspaceId: string, data: UpdateWorkspaceDto, session?: ClientSession): Promise<IWorkspaceDoc | null> {
    return Workspace.findByIdAndUpdate(workspaceId, data, { returnDocument: 'after', runValidators: true, session });
  }

  async findByIdAndDelete(workspaceId: string, session?: ClientSession): Promise<IWorkspaceDoc | null> {
    return Workspace.findByIdAndDelete(workspaceId, { session });
  }

  async existsByOrganization(orgId: string): Promise<boolean> {
    const workspace = await Workspace.exists({ organization: orgId });
    return workspace != null;
  }

  async countByOrganization(orgId: string): Promise<number> {
    return Workspace.countDocuments({
      organization: orgId,
    })
  }

  async findDuplicateName(orgId: string, name: string, excludeWorkspaceId?: string): Promise<IWorkspace | null> {
    const filter: mongoose.QueryFilter<IWorkspaceDoc> = {
      organization: orgId,
      name,
    }

    if (excludeWorkspaceId) {
      filter._id = {
        $ne: new mongoose.Types.ObjectId(excludeWorkspaceId)
      }
    }

    return Workspace.findOne(filter).lean();
  }

}

export default new WorkspaceRepository()