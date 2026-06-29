// src/repositories/workspace.repository.ts
import { ClientSession } from 'mongoose'
import { Workspace } from '@/models/base/index.js'
import { IWorkspace, IWorkspaceDoc } from '@/models/base/types.js'
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
} 

export default new WorkspaceRepository()