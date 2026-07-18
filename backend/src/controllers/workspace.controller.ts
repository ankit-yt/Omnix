import workspaceService from "@/services/workspace.service.js";
import asyncHandler from "@/utils/asyncHandler.js";
import {Request , Response} from 'express';

export const createWorkspace = asyncHandler(async(req:Request , res:Response)=>{
  const organizationId = req.user?.organization?.toString();

  const workspace = await workspaceService.createWorkspace(organizationId , req.body);

  res.status(201).json({
    status:"success",
    message:"Workspace initalized successfully.",
    data:{workspace}
  });
});

export const getWorkspaces = asyncHandler(async(req:Request , res:Response)=>{
  const organizationId = req.user?.organization?.toString();

  const workspaces = await workspaceService.getAllWorkspaces(organizationId);

  res.status(200).json({
    status:"success",
    results:workspaces.length,
    data:{workspaces}
  });
});

export const getWorkspaceById = asyncHandler(async(req:Request , res:Response)=>{
  const organizationId = req.user?.organization?.toString();
  const {workspaceId} = req.params;

  const workspace = await workspaceService.getWorkspaceById(workspaceId as string , organizationId);

  res.status(200).json({
    status:"success",
    data:{workspace}
  });
});

export const updateWorkspace = asyncHandler(async(req:Request , res:Response)=>{
  const organizationId = req.user?.organization?.toString();
  const {workspaceId} = req.params;

  const workspace = await workspaceService.updateWorkspace(workspaceId as string, organizationId, req.body);

  res.status(200).json({
    status: "success",
    message: "Workspace updated parameters saved.",
    data: { workspace }
  });
})

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organization?.toString();
  const { workspaceId } = req.params;

  await workspaceService.deleteWorkspace(workspaceId as string, organizationId);

  res.status(204).json(null);
});