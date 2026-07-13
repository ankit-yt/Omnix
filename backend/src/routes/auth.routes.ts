import { getMe, login, logout, refresh, register } from '@/controllers/auth.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import { Router } from 'express';
// import rateLimit from 'express-rate-limit'
const router = Router();
// const registerLimiter = rateLimit({
//   windowMs:60*60*1000,
//   max:3,
//   message:{status:'fail',message:'Too many request created from this IP. Please try again later.'}
// })

// const loginLimiter = rateLimit({
//   windowMs:15*60*1000,
//   max:10,
//   message:{status:"fail",message:"Too many login attempts. Please try again later."}
// })

router.post('/register',register);
router.post('/login',login);
router.post('/refresh',refresh);
router.post('/logout',logout);

router.get('/me',authenticate,getMe)

export default router;