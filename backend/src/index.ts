
import dotenv from 'dotenv'
dotenv.config();
import express, { Application } from 'express'
import { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import helmet from 'helmet'
import AppError from '@/utils/AppError.js';
import errorHandler from '@/middleware/errorHandler.js';
import { connectDatabase } from '@/config/database.js';


import authRouter from '@/routes/auth.routes.js';
import documentRouter from '@/routes/document.routes.js';
import chatRouter from '@/routes/chat.routes.js';
import planRouter from '@/routes/plan.routes.js';
import paymentRouter from '@/routes/payment.routes.js';
import adminRouter from '@/routes/admin.routes.js';
import workspaceRouter from '@/routes/workspace.routes.js';
import billingCronService from '@/services/billingCron.service.js';
import chatSessionRouter from '@/routes/chatSession.routes.js';
import publicWidgetRoutes from '@/routes/publicWidget.routes.js';


const app: Application = express()
const PORT = process.env.PORT || 5000


app.set('trust proxy', 1);

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);
app.use(cors({
  origin:[ process.env.NEXTAUTH_URL || 'http://localhost:3000' ,"https://barber-queue-eta.vercel.app" , "http://localhost:5173"],
  credentials: true
}))
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));

app.use('/api', express.json());


app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/plans', planRouter);
app.use('/api/subscription', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/chatSessions', chatSessionRouter);
app.use('/api/public/widget', publicWidgetRoutes);


app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next(new AppError(`Route ${req.originalUrl} not found`, 404))
})

app.use(errorHandler)

const startServer = async () => {
  await connectDatabase();

  billingCronService.start();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
};

startServer();