
import dotenv from 'dotenv'
dotenv.config();
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import AppError from '@/utils/AppError.js';
import errorHandler from '@/middleware/errorHandler.js';
import { connectDatabase } from '@/config/database.js';
import authRoute from '@/routes/auth.routes.js';


const app = express()
const PORT = process.env.PORT || 5000


app.set('trust proxy',1);

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
    message:"Omnix is running",
    timeStamp:new Date().toString()
  })
})

app.use('/',authRoute);



app.use((req, res, next) => {
 console.log(req.method, req.originalUrl);
  next(new AppError(`Route ${req.originalUrl} not found`, 404))
})

app.use(errorHandler)

connectDatabase()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})