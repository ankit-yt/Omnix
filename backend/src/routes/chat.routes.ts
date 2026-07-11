import { handleUserMessage } from "@/controllers/chat.controller.js";
import { authenticate } from "@/middleware/authenticate.js";
import { Router } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const chatLimiter = rateLimit({
  windowMs:1*6*1000,
  max:15,
  message:{status:'fail',message:'You are sending message too fast. Please slow down.'}
});

router.use(authenticate);

router.post('/message',chatLimiter,handleUserMessage);

export default router;