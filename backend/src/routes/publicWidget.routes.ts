
import { Router } from 'express';
import { initializeWidget } from '@/controllers/publicWidget.controller.js';

const router = Router();

router.get('/init/:workspaceId', initializeWidget);

export default router;