import { createWorkspace, deleteWorkspace, getWorkspaceById, getWorkspaces, updateWorkspace } from '@/controllers/workspace.controller.js';
import { authenticate } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '@/validators/workspace.validator.js';
import {Router} from 'express';

const router = Router();

router.use(authenticate);

router.route("/")
  .get(getWorkspaces)
  .post(validate(createWorkspaceSchema) , createWorkspace);

router.route("/:workspaceId")
  .get(getWorkspaceById)
  .patch(validate(updateWorkspaceSchema) , updateWorkspace)
  .delete(deleteWorkspace);

export default router;