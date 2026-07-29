import { api } from "@/lib/api";


export interface SendMessagePayload {
  workspaceId: string;
  content: string;
  sessionId?: string | null;
}

export const chatService = {
  sendMessage: async (payload: SendMessagePayload) => {
    // Your backend expects page and client metadata for the DTO
    const data = {
      ...payload,
      page: {
        url: window.location.href,
        title: document.title || 'Omnix Dashboard'
      },
      client: {
        userAgent: navigator.userAgent
      }
    };

    // Assuming your chat routes are mounted at /api/chat in server.ts
    const response = await api.post('/chat/message', data);
    return response.data.data; 
    // Returns: { messageId, sessionId, answer, sourcesUsed }
  },

  getSessions: async(workspaceId:string , page= 1 , limit = 20)=>{
    const response = await api.get(`/chatSessions`,{
      params:{workspaceId, page, limit}
    });
    return response.data;
  },

  getSessionMessages : async(sessionId:string)=>{
    const response = await api.get(`/chatSessions/${sessionId}/messages`);
    return response.data;
  }
};