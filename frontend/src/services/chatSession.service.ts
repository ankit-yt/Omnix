import { api } from "@/lib/api";

export interface ChatSessionSummary{
  _id:string,
  title:string,
  updatedAt:string;
  lastActivityAt?:string;
}

export interface SessionListMeta{
  total:number;
  page:number;
  limit:number;
  totalPages:number;
  hasMore:boolean;
}

class ChatSessionService{

  async getWorkspaceSessions(
    workspaceId:string,
    page:number = 1,
    limit:number = 20
  ):Promise<{data:ChatSessionSummary[] ; meta: SessionListMeta}>{
    const res = await api.get("/chatSessions",{
      params :{workspaceId, page , limit}
    })
     return res.data.data;
  }
}

export const chatSessionService = new ChatSessionService();
export default chatSessionService;