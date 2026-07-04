import { uploadAndProcessDocument } from '@/controllers/document.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);

router.post('/upload',uploadAndProcessDocument);

export default router;
