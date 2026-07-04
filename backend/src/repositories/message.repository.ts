import { ClientSession } from "mongoose";
import { Message } from '@/models/base/index.js';
import { IMessage, IMessageDoc } from '@/models/base/types.js';

class MessageRepository{

  async create(data:Partial<IMessage>,session?:ClientSession):Promise<IMessageDoc>{
    const [message] = await Message.create([data],{session});
    return message;
  };

  async findBySession(sessionId:string, limit:number = 10):Promise<IMessage[]>{
    return await Message.find({session:sessionId})
      .sort({createdAt:-1})
      .limit(limit)
      .lean();
  }

}


export default new MessageRepository();