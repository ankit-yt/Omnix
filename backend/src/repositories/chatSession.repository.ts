import { ChatSession } from "@/models/base/index.js"
import { IChatSession, IChatSessionDoc } from "@/models/base/types.js"
import { CreateChatSessionDto, UpdateChatSessionDto } from "@/validators/chatSession.validator.js";
import { ClientSession } from "mongoose";

class ChatSessionRepository{
  async create(organizationId:string ,workspaceId:string, dto:CreateChatSessionDto , session?:ClientSession):Promise<IChatSessionDoc>{
    const chatSession = new ChatSession({
      organization:organizationId,
      workspace:workspaceId,
      ...dto,
    });

    await chatSession.save({session});
    
    return chatSession;
  }

  async findByIdAndUpdate(chatSessionId:string , dto:UpdateChatSessionDto , session?:ClientSession):Promise<IChatSessionDoc | null>{
    return ChatSession.findByIdAndUpdate(chatSessionId , dto ,{new:true , runValidators:true , session});
  }

  async findById(chatSessionId:string):Promise<IChatSession | null>{
    return ChatSession.findById(chatSessionId).lean();
  }

  async findPaginated(organizationId:string , workspaceId:string , skip:number , limit:number):Promise<IChatSessionDoc[]>{
    return ChatSession.find({
      organization:organizationId,
      workspace:workspaceId,
      isActive:true
    }).sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async countByWorkspace(organizationId:string, workspaceId:string):Promise<number>{
    return ChatSession.countDocuments({
      organization:organizationId,
      workspace:workspaceId,
      isActive:true
    });
  }
}

export default new ChatSessionRepository();