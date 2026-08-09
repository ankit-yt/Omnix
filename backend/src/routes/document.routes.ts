import { deleteDocument, getDocuments, triggerWebsiteCrawl, uploadAndProcessDocument } from '@/controllers/document.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import multer from 'multer';
import {Router} from 'express';

const router = Router();

const upload = multer({
  storage:multer.memoryStorage(),
  limits:{fileSize:20*1024*1024},
});


router.use(authenticate);
router.get('/', getDocuments);
router.post('/upload',upload.single('document'), uploadAndProcessDocument);
router.post("/:workspaceId/crawl", triggerWebsiteCrawl);
router.delete('/:documentId', deleteDocument)

export default router;
