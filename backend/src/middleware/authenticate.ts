import { Organization, User } from '@/models/base'
import AppError from '@/utils/AppError'
import asyncHandler from '@/utils/asyncHandler'
import { verifyAccessToken } from '@/utils/generateToken'
import { NextFunction , Request , Response } from 'express'

export const authenticate = asyncHandler(
  async(req:Request,res:Response,next:NextFunction)=>{
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer ")){
      throw new AppError("Access token missing. Please log in.",401)
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId)
    if(!user){
      throw new AppError("User no longer exists.",401)
    }
    if(!user.isActive){
      throw new AppError('You account has been deactivated.',401)
    }

    req.user = user
    next()


  }
)

export const restrictTo = (...roles:string[])=>{
  return (req:Request, res:Response, next:NextFunction)=>{
    if(!req.user || !roles.includes(req.user.role)){
      throw new AppError("You do not have permission to perform this action" , 403)
    }
    next()
  }
}

export const authenticateWidget = asyncHandler(
  async(req:Request , res:Response , next:NextFunction)=>{
    const apiKey = req.header('x-api-key');
    if(!apiKey) throw new AppError('Api key is required.',401);
    const org = await Organization.findOne({apiKey}).select('+apiKey').lean();
    if(!org) throw new AppError('Invalid API key',401);
    if(org.isDeleted) throw new AppError('Organization account no longer exists.',403);
    if(!org.isActive) throw new AppError('Organization account is inactive.',403);

    const limits = org.cachedLimits;
    if(!limits){
      throw new AppError('System error: Billing limits not configured for this organization.', 500)
    }

    if(org.usage.messagesThisMonth >= limits.messagesPerMonth){
      throw new AppError(`Monthly limit of ${limits.messagesPerMonth} messages reached. Please upgrade to continue.`, 429)
    }

    req.organization = org;
    req.resolvedLimits = limits;

    next();
  }
)