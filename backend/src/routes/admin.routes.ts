import { createPlan, createPromotion } from '@/controllers/admin.controller.js';
import { authenticate, restrictTo } from '@/middleware/authenticate.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);
router.use(restrictTo('admin'));

router.post('/promotions',createPromotion);
router.post('/plans',createPlan);

export default router;