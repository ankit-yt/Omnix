import { Organization } from "@/models/base/index.js";
import { IWorkspace, IWorkspaceDoc } from "@/models/base/types.js";
import organizationRepository from "@/repositories/organization.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import AppError from "@/utils/AppError.js";
import { CreateWorkspaceDto, UpdateWorkspaceDto } from "@/validators/workspace.validator.js";
import mongoose from "mongoose";

class WorkspaceService{


  async getAllWorkspaces(organizationId:string):Promise<IWorkspace[]>{

    const orgExists = await workspaceRepository.existsByOrganization(organizationId);
    if(!orgExists) throw new AppError("Target organization context invalid",404);
    
    return await workspaceRepository.findByOrganization(organizationId);
  }

  async createWorkspace(organizationId:string , dto:CreateWorkspaceDto):Promise<IWorkspaceDoc>{
    if(!organizationId) throw new AppError("Organization environment contenxt missing.",401);

    const organization = await organizationRepository.findById(organizationId);
    if(!organization){
      throw new AppError("The assocaited organization record could not be found.",400);
    }

    const currentWorkspaceCount = await workspaceRepository.countByOrganization(organizationId);
    const maxAllowed = organization.cachedLimits.maxWorkspaces;

    if(currentWorkspaceCount >= maxAllowed){
      throw new AppError(`Workspace quote exceeded. Your current plan limits you to ${maxAllowed} workspaces.`,403);
    }

    const nameExists = await workspaceRepository.findDuplicateName(organizationId , dto.name);
    if(nameExists){
      throw new AppError("A workspace with this name already exists within your organization.",409);
    }

    const session = await mongoose.startSession();
    try{
      session.startTransaction();
      const newWorkspace = await workspaceRepository.create({
      organization:new mongoose.Types.ObjectId(organizationId),
      ...dto
    }, session);

    await organizationRepository.updateWorkspaceCount(organizationId , 1,session);

    await session.commitTransaction();
    return newWorkspace;
    
  }catch(err){
    await session.abortTransaction();
    console.log(err);
    throw err;
  }finally{
    session.endSession();
  }
}

  async getWorkspaceById(workspaceId:string , organizationId:string):Promise<IWorkspace>{
    const workspace = await workspaceRepository.findById(workspaceId);

    if(!workspace || workspace.organization.toString() != organizationId){
      throw new AppError("Requestd workspace resource not found.",404);
    }

    return workspace;
  }

  async updateWorkspace(workspaceId:string , organizationId:string , dto:UpdateWorkspaceDto):Promise<IWorkspaceDoc>{
    const workspace = await this.getWorkspaceById(workspaceId , organizationId);

    if(dto.name && dto.name !== workspace.name){
      const nameConflict = await workspaceRepository.findDuplicateName(organizationId ,dto.name , workspaceId);
      if(nameConflict) throw new AppError("Workspace name choice conflicts with an existing asset.",409);
    }

    const updatedWorkspace = await workspaceRepository.findByIdAndUpdate(workspaceId, dto );
    if (!updatedWorkspace) throw new AppError("Failed to update workspace properties.", 500);

    return updatedWorkspace;
  }

  async deleteWorkspace(workspaceId:string , organizationId:string):Promise<void>{

    const session = await mongoose.startSession();
    try{
       session.startTransaction();

      await workspaceRepository.softDelete(workspaceId , session);
      await organizationRepository.updateWorkspaceCount(organizationId , -1, session);
      session.commitTransaction();
    }catch(err){
      await session.abortTransaction();
      throw err;
    }finally{
      await session.endSession();
    }
  }
}

export default new WorkspaceService();