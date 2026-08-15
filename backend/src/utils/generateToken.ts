import { IUser } from '@/models/User.js';
import AppError from '@/utils/AppError.js';
import jwt from 'jsonwebtoken';

export interface JwtPayLoad {
  userId: string,
  organizationId: string,
  role: string
}

export const generateAccessToken = (user: IUser): string => {
  const payload: JwtPayLoad = {
    userId: user._id!.toString(),
    organizationId: user.organization.toString(),
    role: user.role
  }

  return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN as string, { expiresIn: '15m' })
}

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id!.toString() },
    process.env.JWT_REFRESH_TOKEN as string,
    { expiresIn: '7d' }
  )
}

export const verifyAccessToken = (token: string): JwtPayLoad => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_TOKEN as string
  ) as JwtPayLoad
}

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN as string
    ) as { userId: string };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid refresh token. Please log in again.', 401);
  }
}