import {ZodType ,z, ZodError} from 'zod';
import { NextFunction , Request , Response } from 'express';
export const validate = (schema : ZodType)=>
(req:Request, res:Response , next:NextFunction)=>{
  try{
    req.body = schema.parse(req.body);
    next();
  }catch(err){
    if(err instanceof ZodError){
      return res.status(400).json({
        success:false,
        message:"Validation failed",
        errors:err.issues,
      });
    }
    next(err);
  }
}