// controllers/publicWidget.controller.ts

import workspaceRepository from '@/repositories/workspace.repository.js';
import chatService from '@/services/chat.service.js';
import chatSessionService from '@/services/chatSession.service.js';
import AppError from '@/utils/AppError.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { Request, Response } from 'express';


export const initWidget = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { domain,visitorId  } = req.query;

    if (!workspaceId || !domain) {
        throw new AppError("Workspace ID and domain are required.", 400);
    }

    const result = await chatService.initializeWidget(
        workspaceId as string,
        domain as string,
        (visitorId as string) || ""
    );

    res.status(200).json({
        status: "success",
        data: result
    });
});


// NEW — paginated session history for the widget's "history" view infinite scroll
export const getPublicSessions = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, visitorId, page, limit } = req.query;

  if (!workspaceId || !visitorId) {
    throw new AppError("workspaceId and visitorId are required.", 400);
  }

  const result = await chatSessionService.getPublicWorkspaceSessions(
    workspaceId as string,
    visitorId as string,
    Number(page) || 1,
    Number(limit) || 15
  );

  res.status(200).json({ status: "success", data: result });
});

export const getPublicSessionMessages = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { workspaceId, visitorId } = req.query;

  if (!sessionId || !workspaceId || !visitorId) {
    throw new AppError("workspaceId, visitorId and sessionId are required.", 400);
  }

  const messages = await chatSessionService.getPublicSessionMessages(
    workspaceId as string,
    sessionId as string,
    visitorId as string
  );

  res.status(200).json({ status: "success", data: messages });
});


export const handlePublicChat = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, domain, content, sessionId ,visitorId } = req.body;

    if (!workspaceId || !domain || !content) {
        throw new AppError("Missing required chat parameters.", 400);
    }

    const result = await chatService.processPublicChat({
        workspaceId,
        domain,
        content,
        sessionId,
        visitorId ,
        userAgent: req.headers["user-agent"] as string
    });

    res.status(200).json({
        status: "success",
        data: result
    });
});