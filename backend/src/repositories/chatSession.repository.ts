import { ChatSession } from "@/models/base/index.js"
import { IChatSession, IChatSessionDoc } from "@/models/base/types.js"
import { CreateChatSessionDto, UpdateChatSessionDto } from "@/validators/chatSession.validator.js";
import { ClientSession } from "mongoose";

class ChatSessionRepository {
  async create(organizationId: string, workspaceId: string, dto: CreateChatSessionDto, session?: ClientSession): Promise<IChatSessionDoc> {
    const chatSession = new ChatSession({
      organization: organizationId,
      workspace: workspaceId,
      ...dto,
    });

    await chatSession.save({ session });

    return chatSession;
  }

  async findByIdAndUpdate(chatSessionId: string, dto: UpdateChatSessionDto, session?: ClientSession): Promise<IChatSessionDoc | null> {
    return ChatSession.findByIdAndUpdate(chatSessionId, dto, { returnDocument: 'after', runValidators: true, session });
  }

  async findById(chatSessionId: string): Promise<IChatSession | null> {
    return ChatSession.findById(chatSessionId).lean();
  }

  async findPaginated(organizationId: string, workspaceId: string, skip: number, limit: number): Promise<IChatSessionDoc[]> {
    return ChatSession.find({
      organization: organizationId,
      workspace: workspaceId,
      isActive: true
    }).sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findPaginatedByVisitor(
  workspaceId: string,
  visitorId: string,
  skip: number,
  limit: number
): Promise<{ sessions: IChatSessionDoc[]; total: number }> {
  const [sessions, total] = await Promise.all([
    ChatSession.find({ workspace: workspaceId, visitorId, isActive: true })
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title lastActivityAt')
      .lean(),
    ChatSession.countDocuments({ workspace: workspaceId, visitorId, isActive: true })
  ]);

  return { sessions, total };
}

  async countByWorkspace(organizationId: string, workspaceId: string): Promise<number> {
    return ChatSession.countDocuments({
      organization: organizationId,
      workspace: workspaceId,
      isActive: true
    });
  }

  async findRecentByVisitor(
  workspaceId: string,
  visitorId: string,
  limit: number = 10
): Promise<IChatSessionDoc[]> {
  return ChatSession.find({
    workspace: workspaceId,
    visitorId,
    isActive: true,
  })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .select('_id title lastActivityAt')
    .lean();
}

async recordSessionActivity(chatSessionId: string, session?: ClientSession): Promise<void> {
  await ChatSession.findByIdAndUpdate(
    chatSessionId,
    { $set: { lastActivityAt: new Date() }, $inc: { messageCount: 1 } },
    { session }
  );
}

}

export default new ChatSessionRepository();