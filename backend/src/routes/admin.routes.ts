import { createPlan, createPromotion, getAllPlansAdmin, getSystemSetting, linkRazorpayPlan, setPlanActiveStatus, updatePlan, updateSystemSetting } from '@/controllers/admin.controller.js';
import { authenticate, restrictTo } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { setPlanActiveStatusSchema, updatePlanSchema } from '@/validators/admin.validator.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);
router.use(restrictTo('super_admin'));

router.post('/promotions',createPromotion);
router.post('/plans',createPlan);
router.get('/plans', getAllPlansAdmin);
// router.patch('/plans/:code/link-gateway' , validate(updatePlanSchema) , linkRazorpayPlan);

router.patch('/plans/:code' , validate(updatePlanSchema) , updatePlan);
router.patch('/plans/:code/status', validate(setPlanActiveStatusSchema), setPlanActiveStatus);
router.get('/settings/:key', getSystemSetting);
router.put('/settings/:key', updateSystemSetting);

export default router;