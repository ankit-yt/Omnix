import { createPlan, createPromotion, linkRazorpayPlan, updatePlan } from '@/controllers/admin.controller.js';
import { authenticate, restrictTo } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { updatePlanSchema } from '@/validators/admin.validator.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);
router.use(restrictTo('admin'));

router.post('/promotions',createPromotion);
router.post('/plans',createPlan);

// router.patch('/plans/:code/link-gateway' , validate(updatePlanSchema) , linkRazorpayPlan);
router.patch('/plans/:code' , validate(updatePlanSchema) , updatePlan);

export default router;