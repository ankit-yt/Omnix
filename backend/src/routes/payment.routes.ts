import { createCheckout, handleWebHook } from '@/controllers/payment.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import {Router} from 'express';
import express from 'express';

const router = Router();

router.post(
  '/webhook',
  express.json({
    verify:(req:any, res, buf)=>{
      req.rawBody = buf.toString();
    }
  }),
  handleWebHook
);

router.use(authenticate);

router.post('/checkout',createCheckout);

export default router; 