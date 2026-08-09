import chatSessionService from '@/services/chatSession.service.js';
import AppError from '@/utils/AppError.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { Request, Response } from 'express';

export const getChatSessions = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organization?.toString();
  if (!organizationId) {
    throw new AppError("Unauthorized context missing.", 401);
  }

  const { workspaceId, page, limit } = req.query;
  if (!workspaceId) {
    throw new AppError("Missing required query parameter: workspaceId", 400);
  }

  const result = await chatSessionService.getWorkspaceSessions(
    organizationId,
    workspaceId as string,
    Number(page) || 1,
    Number(limit) || 20
  );

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const getSessionMessages = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organization?.toString();
  if (!organizationId) {
    throw new AppError("Unauthorized context missing.", 401);
  }

  const { sessionId } = req.params;
  const { limit, before } = req.query;

  if (!sessionId) {
    throw new AppError("Missing required parameter: sessionId", 400);
  }

  const result = await chatSessionService.getSessionMessages(
    organizationId,
    sessionId as string,
    Number(limit) || 30,
    before as string | undefined
  );

  res.status(200).json({
    status: "success",
    data: result.data,
    meta: {
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    }
  });
});