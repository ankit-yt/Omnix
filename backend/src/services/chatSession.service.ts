import { IChatSession } from "@/models/ChatSession.js";
import chatSessionRepository from "@/repositories/chatSession.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import { PaginationResult } from "@/types/pagination.types.js";
import AppError from "@/utils/AppError.js";

class ChatSessionServce{

  async getWorkspaceSessions(
    organizationId:string,
    workspaceId:string,
    page:number = 1,
    limit:number = 2,
  ):Promise<PaginationResult<IChatSession>>{
    const workspace = await workspaceRepository.findById(workspaceId);
    if(!workspace || workspace.organization.toString() !== organizationId){
      throw new AppError("Target workspace resource not found.",404);
    }

    const sanitizedPage = Math.max(1 , page);
    const sanitizeLimit = Math.min(100 , Math.max(1,limit));
    const skip = (sanitizedPage - 1)  * sanitizeLimit;

    const [sessions , totalCount ] = await Promise.all([
      chatSessionRepository.findPaginated(organizationId , workspaceId , skip , sanitizeLimit),
      chatSessionRepository.countByWorkspace(organizationId , workspaceId)
    ]);

    const totalPages = Math.ceil(totalCount / sanitizeLimit);
    return {
      data:sessions,
      meta:{
        total:totalCount,
        page:sanitizedPage,
        limit:sanitizeLimit,
        totalPages,
        hasMore:sanitizedPage< totalPages
      }
    };
  }

}

export default new ChatSessionServce();