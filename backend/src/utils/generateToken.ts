import { Response } from 'express'
import jwt from 'jsonwebtoken'
import { IUser } from "@/models/User"

export interface JwtPayLoad{
  userId:string,
  organizationId:string,
  role:string
}


export const generateAccessToken = (user:IUser):string=>{
  const payload : JwtPayLoad = {
    userId : user._id.toString(),
    organizationId:user.organization.toString(),
    role:user.role
  }

  return jwt.sign(payload,process.env.JWT_ACCESS_TOKEN as string , {expiresIn:'15m'})
}

export const generateRefreshToken = (user:IUser):string=>{
  return jwt.sign(
    {userId:user._id.toString()},
    process.env.JWT_REFRESH_TOKEN as string,
    {expiresIn:'7d'}
  )
}

export const sendRefreshToken = (res:Response,refreshToken:string):void=>{
  res.cookie('refreshToken',refreshToken,{
    httpOnly:true,
    secure:process.env.NODE_ENV === 'production',
    sameSite:'strict',
    maxAge:7*24*60*60*1000
  })
}

export const verifyAccessToken = (token:string):JwtPayLoad=>{
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_TOKEN as string
  ) as JwtPayLoad
}

export const verifyRefreshToken = (token:string):{userId:string}=>{
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_TOKEN as string
  ) as {userId:string}
}