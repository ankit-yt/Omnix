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

  async existsByOrganization(orgId:string):Promise<boolean>{
    const workspace = await Workspace.exists({organization:orgId});
    return workspace != null;
  }

  async countByOrganization(orgId:string):Promise<number>{
    return Workspace.countDocuments({
      organization:orgId,
    })
  }

  async findByOrganizationAndName(orgId:string , name:string):Promise<IWorkspace | null>{
    return await Workspace.findOne({
      organization:orgId,
      name,
    }).lean();
  }

} 

export default new WorkspaceRepository()