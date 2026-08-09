import { IChatSession } from "@/models/ChatSession.js";
import chatSessionRepository from "@/repositories/chatSession.repository.js";
import messageRepository from "@/repositories/message.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import { PaginationResult } from "@/types/pagination.types.js";
import AppError from "@/utils/AppError.js";

class ChatSessionService {

  async getWorkspaceSessions(
    organizationId: string,
    workspaceId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginationResult<IChatSession>> {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace || workspace.organization.toString() !== organizationId) {
      throw new AppError("Target workspace resource not found.", 404);
    }

    const sanitizedPage = Math.max(1, page);
    const sanitizeLimit = Math.min(100, Math.max(1, limit));
    const skip = (sanitizedPage - 1) * sanitizeLimit;

    const [sessions, totalCount] = await Promise.all([
      chatSessionRepository.findPaginated(organizationId, workspaceId, skip, sanitizeLimit),
      chatSessionRepository.countByWorkspace(organizationId, workspaceId)
    ]);

    const totalPages = Math.ceil(totalCount / sanitizeLimit);
    return {
      data: sessions,
      meta: {
        total: totalCount,
        page: sanitizedPage,
        limit: sanitizeLimit,
        totalPages,
        hasMore: sanitizedPage < totalPages
      }
    };
  }

  async getSessionMessages(organizationId: string, sessionId: string , limit:number = 30 , before?:string) {
    // 1. Verify the session exists and belongs to the correct organization
    const session = await chatSessionRepository.findById(sessionId);

    if (!session || session.organization.toString() !== organizationId) {
      throw new AppError("Chat session not found or access denied.", 404);
    }

    const sanitizedLimit = Math.min(100, Math.max(1, limit));
     return messageRepository.findBySessionPaginated(sessionId, sanitizedLimit, before);
  
  }

    async getPublicWorkspaceSessions(
    workspaceId: string,
    visitorId: string,
    page: number = 1,
    limit: number = 15
  ) {
    const sanitizedPage = Math.max(1, page);
    const sanitizedLimit = Math.min(50, Math.max(1, limit));
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const { sessions, total } = await chatSessionRepository.findPaginatedByVisitor(
      workspaceId,
      visitorId,
      skip,
      sanitizedLimit
    );

    const totalPages = Math.ceil(total / sanitizedLimit);

    return {
      data: sessions.map(s => ({
        id: s._id!.toString(),
        title: s.title,
        lastMessageAt: s.lastActivityAt,
      })),
      meta: {
        page: sanitizedPage,
        totalPages,
        hasMore: sanitizedPage < totalPages
      }
    };
  }

async getPublicSessionMessages(
    workspaceId: string,
    sessionId: string,
    visitorId: string,
    limit: number = 30,
    before?: string
  ) {
    const session = await chatSessionRepository.findById(sessionId);

    if (
      !session ||
      session.workspace.toString() !== workspaceId ||
      session.visitorId !== visitorId
    ) {
      throw new AppError("Chat session not found.", 404);
    }

    const sanitizedLimit = Math.min(100, Math.max(1, limit));
    const result = await messageRepository.findBySessionPaginated(sessionId, sanitizedLimit, before);

    return {
      ...result,
      data: result.data.map(m => ({
        id: (m as any)._id?.toString?.() ?? Date.now(),
        role: m.role,
        content: m.content,
        createdAt: (m as any).createdAt,
      }))
    };
  }
}

export default new ChatSessionService();