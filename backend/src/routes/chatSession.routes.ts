import { getChatSessions, getSessionMessages } from "@/controllers/chatSession.controller.js";
import { authenticate } from "@/middleware/authenticate.js";
import { Router } from "express"; 

const router = Router();

router.use(authenticate);
router.get("/" , getChatSessions);
router.get("/:sessionId/messages", getSessionMessages)

export default router;