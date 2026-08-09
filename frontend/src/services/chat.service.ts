// services/chat.service.ts
import { api } from "@/lib/api"; // adjust to your actual axios instance path

export interface ChatMessageResponse {
  id: string;
  role: "user" | "ai" | "assistant";
  content: string;
  createdAt?: string;
  citations?: any[];
}

export interface PaginatedMessagesResult {
  data: ChatMessageResponse[];
  meta: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

class ChatService {
  async sendMessage(payload: {
    workspaceId: string;
    content: string;
    sessionId?: string | null;
  }) {
    const res = await api.post("/chat/message", payload);
    return res.data.data;
  }

  async getSessionMessages(
    sessionId: string,
    params?: { limit?: number; before?: string }
  ): Promise<PaginatedMessagesResult> {
    const res = await api.get(`/chatSessions/${sessionId}/messages`, { params });
    return {
      data: res.data.data,
      meta: res.data.meta,
    };
  }
}

export const chatService = new ChatService();
export default chatService;