import { User } from '@/models/base'
import AppError from '@/utils/AppError'
import asyncHandler from '@/utils/asyncHandler'
import { verifyAccessToken } from '@/utils/generateToken'
import express, { NextFunction , Request , Response } from 'express'
import jwt from 'jsonwebtoken'

declare global{
  namespace Express{
    interface Request{
      user?:any
      organization?:string
    }
  }
}

export const authenticate = asyncHandler(
  async(req:Request,res:Response,next:NextFunction)=>{
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer")){
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
    req.organization = decoded.organizationId
    next()


  }
)

export const restrictedTo = (...roles:string[])=>{
  return (req:Request, res:Response, next:NextFunction)=>{
    if(!roles.includes(req.user?.role)){
      throw new AppError("You do not have permission to perform this action" , 403)
    }
    next()
  }
}