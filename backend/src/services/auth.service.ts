import organizationRepository from "@/repositories/organization.repository.js"
import planRepository from "@/repositories/plan.repository.js";
import subscriptionRepository from "@/repositories/subscription.repository.js";
import userRepository from "@/repositories/user.repository.js";
import workspaceRepository from "@/repositories/workspace.repository.js";
import { AuthResult, RegisterInput } from "@/types/auth.types.js";
import AppError from "@/utils/AppError.js";
import { generateAccessToken, generateRefreshToken, sendRefreshToken, verifyRefreshToken } from "@/utils/generateToken.js";
import crypto from 'crypto'
import mongoose from "mongoose";
import {Response} from 'express'
import { IUser } from "@/models/User.js";
class AuthService{

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  private async resolveUniqueSlug(base:string):Promise<string>{
    const existing = await organizationRepository.findBySlug(base);
    if(!existing) return base;
    return `${base}-${Math.random().toString(36).substring(2,7)}`
  }

  private generateApiKeyData() {
    const key = `erpg_${crypto.randomBytes(32).toString('hex')}`
    return {
      apiKey: key,
      apiPrefix: key.substring(0, 12) + '...',
    }
  }

  async register(input:RegisterInput , res:Response):Promise<AuthResult>{
    const {name, email, password, organizationName, website, contactEmail} = input;

    const existingUser = await userRepository.findByEmail(email);
    if(existingUser){
      throw new AppError('An account with this email already exists', 400);
    }

    const existingOrg = await organizationRepository.findByWebsite(website);
    if(existingOrg){
      throw new AppError('This website is already registered.',400);
    }

    const freePlan = await planRepository.findByCode('free');
    if(!freePlan){
      throw new AppError('System error: Free plan not configured. Contact support.',500);
    }

    const baseSlug = this.generateSlug(organizationName);
    const slug = await this.resolveUniqueSlug(baseSlug);

    const orgId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const subscriptionId = new mongoose.Types.ObjectId();
    const workspaceId = new mongoose.Types.ObjectId();

    const {apiKey , apiPrefix} = this.generateApiKeyData();
    
    let user:any;
    let organization:any;

    const session = await mongoose.startSession();

    try{
      await session.withTransaction(async()=>{
        organization = await organizationRepository.create({
          _id:orgId,
          createdBy:userId,
          name:organizationName,
          slug,
          website,
          contactEmail,
          apiKey,
          apiKeyPrefix:apiPrefix,
          cachedPlan:'free',
          cachedLimits:freePlan.limits,
          subscription:{
            activeSubscriptionId:subscriptionId,
            status:'active'
          }

        },session)

        await workspaceRepository.create({
          _id : workspaceId,
          organization:orgId,
          name:'My Workspace',
          description:'Your default workspace',
          isActive:true,
        },session)

        user = await userRepository.create({
          _id:userId,
          name,
          email,
          password,
          role:'admin',
          organization:orgId,
          isEmailVerified:false,
        },session)

        await subscriptionRepository.create({
          _id:subscriptionId,
          organization:orgId,
          plan:'free',
          status:'active',
          lockedLimits:freePlan.limits,
          history:[
            {
              event:'activated',
              fromPlan:'',
              toPlan:'free',
              fromStatus:'',
              toStatus:'active',
              occurredAt:new Date(),
              note:'Account registered on perpetual free plan',
            },
          ],
        },session)
      })
    }catch(error:any){
      if(error.code === 11000){
        throw new AppError('Registration conflict. This email or website was just registered.', 409);
      }
      throw error;
    }finally{
      await session.endSession();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userRepository.updateRefreshToken(user._id.toString(), refreshToken);
    sendRefreshToken(res,refreshToken)

    return {
      accessToken,
      data:{
        user,
        organization,
        rawApiKey:apiKey
      },
    }
  }

  async login(email:string, password:string, res:Response):Promise<AuthResult>{
    const user = await userRepository.findByEmail(email);

    if(!user){
      throw new AppError('Invalid email or password.',401)
    }

   if (user.isLocked()) {
      throw new AppError(
        'Account temporarily locked due to too many failed attempts. Try again later.',
        423
      )
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if(!isPasswordCorrect){
      await userRepository.incrementLoginAttempts(user._id!.toString())
      throw new AppError('Invalid email or password',401)
    }

    await userRepository.resetLoginAttempts(user._id!.toString());

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await userRepository.updateRefreshToken(user._id!.toString(),refreshToken);
    sendRefreshToken(res,refreshToken);

    return {
      accessToken,
      data:{user},
    }
  }

  async refresh(token:string | undefined):Promise<{accessToken:string}>{
    if (!token) {
      throw new AppError('Refresh token missing. Please log in again.', 401)
    }

    const decode = verifyRefreshToken(token)
    const user = await userRepository.findByIdWithRefreshToken(decode.userId);
    if(!user || user.refreshToken !== token){
      throw new AppError('Invalid refresh token. Please log in again.',401);
    }

    const accessToken = generateAccessToken(user)
    return {accessToken};
  }

  async logout(token:string | undefined, res:Response):Promise<void>{
    if(token){
      await userRepository.clearRefreshToken(token)
    }

    res.clearCookie('refreshToken',{
      httpOnly:true,
      secure:process.env.NODE_ENV === 'production',
      sameSite:'strict'
    })
  }

  async getMe(userId:string):Promise<{user:IUser}>{
    const user = await userRepository.findByIdPopulatedId(userId);
    if(!user){
      throw new AppError('User not found',404)
    }

    return {user}
  }
}

export default new AuthService();

