import { getAllPlans, getPlanDetails } from '@/controllers/plan.controller.js';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

const catalogLimiter = rateLimit({
  windowMs:15*60*1000,
  max:100,
  message:{status:'fail',message:'Too many catalog requests. Please look again in a moment.'}
})

router.use(catalogLimiter);

router.get("/",getAllPlans);
router.get("/:code",getPlanDetails);

export default router;