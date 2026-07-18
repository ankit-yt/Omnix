import { createPlan, createPromotion, linkRazorpayPlan } from '@/controllers/admin.controller.js';
import { authenticate, restrictTo } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { linkRazorpayPlanSchema } from '@/validators/admin.validator.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);
router.use(restrictTo('admin'));

router.post('/promotions',createPromotion);
router.post('/plans',createPlan);

router.patch('/plans/:code/link-gateway' , validate(linkRazorpayPlanSchema) , linkRazorpayPlan);

export default router;