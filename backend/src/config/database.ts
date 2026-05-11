import mongoose from 'mongoose'

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
    await 
  }

}