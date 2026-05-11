import {NextFunction, Response , Request  , ErrorRequestHandler} from 'express'
import AppError from "@/utils/AppError";

const handleDuplicateKeyError = (err:any):AppError =>{
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    `${field} already exists. Please use a different ${field}.`,
    400
  )
}

const handleValidationError = (err:any):AppError=>{
  const errors = Object.values(err.errors).map((el:any)=>el.message)
  return new AppError(
    `Invalid input : ${errors.join('. ')}`,400
  )
}

const handleCastError = (err:any):AppError=>{
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400)
}

const handleJWTExpiredError =  ():AppError=>{
  return new AppError(`Your session is Expired. Please log in again`, 401)
}

const handleJWTError = ():AppError=>{
  return new AppError("Invalid token. Please log in again", 401)
}

const sendDevError = (err:AppError , res:Response):void=>{
  res.status(err.statusCode).json({
    status:err.status,
    message:err.message,
    error:err,
    stack:err.stack,
  })
}


const sendProdError = (err:AppError , res:Response):void=>{
  if(err.isOperational){
    res.status(err.statusCode).json({
      status:err.statusCode,
      message:err.message
    })
  }else{
    console.log("Unexpected Error: " , err)
    res.status(500).json({
      status:'error',
      message:"Something went wrong. Please try again."
    })
  }
}


const errorHandler: ErrorRequestHandler = (err:any , req:Request , res:Response , next:NextFunction):void=>{
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if(process.env.NODE_ENV == 'development'){
    sendDevError(err , res)
  }else{
    let error = {...err , message: err.message}
     if (err.code === 11000) error = handleDuplicateKeyError(error)
    if (err.name === 'ValidationError') error = handleValidationError(error)
    if (err.name === 'CastError') error = handleCastError(error)
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()
    if (err.name === 'JsonWebTokenError') error = handleJWTError()

    sendProdError(error, res)
  }
}

export default errorHandler