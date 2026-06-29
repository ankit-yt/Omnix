import User, { IUser } from "@/models/User.js";
import { ClientSession } from "mongoose";

class UserRespository{

  async findById(id:string):Promise<IUser | null>{
    return User.findById(id).lean();
  }

  async findByEmail(email:string):Promise<IUser | null>{
    return User.findOne({email}).lean();
  }

  async findByEmailWithSecrets(email:string):Promise<IUser | null>{
    return User.findOne({email}).select('+password +refreshToken +loginAttempts +localUntil');
  }

  async findByIdWithRefreshToken(id:string):Promise<IUser | null>{
    return User.findById(id).select('+refreshToken');
  }

  async findByIdPopulatedId(id:string):Promise<IUser | null>{
    return User.findById(id).populate(
      'organization',
      'name slug website cachedPlan cachedLimits cachedUsage subscription onboardingStatus apiPrifix'
    );
  }

  async create(data:Partial<IUser>,session?:ClientSession):Promise<IUser>{
    const [user] = await User.create([data],{session});
    return user; 
  }

  async updateRefreshToken(userId:string,refreshToken:string,session?:ClientSession):Promise<void>{
    await User.findByIdAndUpdate(userId,{refreshToken},{session});
  }

  async clearRefreshToken(refreshToken:string):Promise<void>{
    await User.findOneAndUpdate({refreshToken},{$unset:{refreshToken:1}})
  }

  async incrementLoginAttempts(userId:string):Promise<void>{
    await User.findByIdAndUpdate(userId,{$inc:{loginAttemps:1}});
  }

  async resetLoginAttempts(userId:string):Promise<void>{
    await User.findByIdAndUpdate(userId,{$set:{loginAttemps:0,lastLogin:new Date()},$unset:{lockUntil:1}})
  }
}

export default new UserRespository();