import { cancelUserSubscription, createCheckout, handleWebHook, syncRazorpaySubscription } from '@/controllers/payment.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { syncRazorpaySubscriptionSchema } from '@/validators/payment.validator.js';
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
router.post('/sync',validate(syncRazorpaySubscriptionSchema) , syncRazorpaySubscription)
router.post('/cancel', cancelUserSubscription)

export default router; 