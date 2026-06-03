
import dotenv from 'dotenv'
dotenv.config();
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import AppError from '@/utils/AppError';
import errorHandler from '@/middleware/errorHandler';
import { connectDatabase } from '@/config/database';


const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin : process.env.NEXTAUTH_URL || 'http://localhost:3000',
  credentials:true
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/health" , (req, res)=>{
  console.log("user visited")
  res.json({
    status:"ok",
    message:"ERP Genius is running",
    timeStamp:new Date().toString()
  })
})



app.use((req, res, next) => {
  console.log("Invalid route hit")
  next(new AppError(`Route ${req.originalUrl} not found`, 404))
})

app.use(errorHandler)

connectDatabase()