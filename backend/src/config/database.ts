import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const MONGODB_URI = process.env.MONGODB_URI || ''

if(!MONGODB_URI){
  throw new Error("MONGODB_URI is not defined in environment variables")
}

let isConnected = false

export const connectDatabase = async ():Promise<void>=>{
  if(isConnected){
    console.log("Using existing database connection")
    return
  }

  try{
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log("Mongoose connected successfully")
  }catch(err){
    console.log("MongoDb connection failed :",err)
    process.exit(1)
  }

}