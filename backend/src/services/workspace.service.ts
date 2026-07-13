import { Organization } from "@/models/base/index.js";
import { IWorkspace, IWorkspaceDoc } from "@/models/base/types.js";
import organizationRepository from "@/repositories/organization.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import AppError from "@/utils/AppError.js";
import { CreateWorkspaceDto } from "@/validators/workspace.validator.js";
import mongoose from "mongoose";

class WorkspaceService{


  async getAllWorkspaces(organizationId:string):Promise<IWorkspace[]>{

    if(!organizationId){
      throw new AppError('OrganizationId is required',400);
    }

    const orgExists = await workspaceRepository.existsByOrganization(organizationId);
    if(!orgExists){
      throw new AppError("The specific organization could not be found.",404);
    }

    const workspaces = await workspaceRepository.findByOrganization(organizationId);
    return workspaces;
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

    const nameExists = await workspaceRepository.findByOrganizationAndName(organizationId , dto.name);
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

    await organizationRepository.incrementWorkspaceCount(organizationId , session);

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
}