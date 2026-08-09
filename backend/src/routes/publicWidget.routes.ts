
import { Router } from 'express';
import {  getPublicSessionMessages, getPublicSessions, handlePublicChat, initWidget } from '@/controllers/publicWidget.controller.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();


const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  message: {
    status: 'error',
    message: 'Too many messages sent from this IP, please try again later.'
  }
});

router.get('/init/:workspaceId', initWidget);
router.get('/sessions', getPublicSessions);
router.get('/messages/:sessionId', getPublicSessionMessages);
router.post('/chat', chatRateLimiter, handlePublicChat);


export default router;