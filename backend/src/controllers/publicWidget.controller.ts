// controllers/publicWidget.controller.ts

import workspaceRepository from '@/repositories/workspace.repository.js';
import AppError from '@/utils/AppError.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { Request, Response } from 'express';

export const initializeWidget = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { domain } = req.query;

  if (!workspaceId || !domain) {
    throw new AppError('Workspace ID and domain are required.', 400);
  }

  // 1. Fetch the workspace
  const workspace = await workspaceRepository.findById(workspaceId as string);

  if (!workspace || workspace.isDeleted) {
    throw new AppError('Widget configuration not found.', 404);
  }

  if (!workspace.isActive) {
    throw new AppError('This widget has been deactivated.', 403);
  }

  // 2. Domain Verification Logic
  // Normalize both domains to prevent bypasses via 'www.' or 'https://'
  const normalizedIncomingDomain = (domain as string)
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .toLowerCase();
  
  const isAllowed = workspace.allowedDomains.some((allowed) => {
    const normalizedAllowed = allowed
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .toLowerCase();
    
    return normalizedAllowed === normalizedIncomingDomain;
  });

  if (!isAllowed) {
    throw new AppError(`Domain unauthorized: ${domain} is not whitelisted.`, 403);
  }

  // 3. Return only the safe, public configuration data
  res.status(200).json({
    status: 'success',
    data: {
      settings: workspace.settings,
      workspaceId: workspace._id
    }
  });
});