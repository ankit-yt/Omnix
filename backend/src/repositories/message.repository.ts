import mongoose, { ClientSession, mongo } from "mongoose";
import { Message } from '@/models/base/index.js';
import { IMessage, IMessageDoc } from '@/models/base/types.js';
import { date } from "zod";


interface PaginatedMessagesResult {
  data: IMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

class MessageRepository {

  async create(data: Partial<IMessage>, session?: ClientSession): Promise<IMessageDoc> {
    const [message] = await Message.create([data], { session });
    return message;
  };

  async findBySession(sessionId: string, limit: number = 50): Promise<IMessage[]> {
    return await Message.find({ session: sessionId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();
  }

  async findRecentBySession(sessionId: string | mongoose.Types.ObjectId, limit: number = 8): Promise<IMessage[]> {
    return await Message.find({ session: sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findBySessionPaginated(sessionId:string | mongoose.Types.ObjectId , limit:number = 30 , before?:string | Date):Promise<PaginatedMessagesResult>{
    const query: Record<string , any> = {session:sessionId};

    if(before){
      query.createdAt = {$lt : new Date(before)};
    }

    const docs = await Message.find(query)
      .sort({createdAt:-1})
      .limit(limit+1)
      .lean();

      const hasMore = docs.length > limit;
      const page = hasMore ? docs.slice(0, limit): docs;
      const chronological = page.slice().reverse();

      const nextCursor = hasMore ? (page[page.length - 1].createdAt as Date).toISOString() : null;

      return {data:chronological , hasMore , nextCursor};
  }

}


export default new MessageRepository();