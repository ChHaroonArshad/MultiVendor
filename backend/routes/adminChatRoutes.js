import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { mediatorMessageSchema, lockSchema, resolveSchema } from "../validators/adminChatValidator.js";
import { createApiError } from "../utils/apiError.js";
import * as ctrl from "../controllers/adminChatController.js";

const router = Router();

const mediatorLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.userId || "anonymous"),
  handler: (req, res, next) => next(createApiError(429, "Too many messages. Please slow down.")),
});

router.use(authMiddleware, roleMiddleware(["admin"]));

router.get("/stats", ctrl.getStats);
router.get("/reports", ctrl.listReports);
router.get("/conversations", ctrl.listConversations);
router.get("/conversations/:id", ctrl.getConversationMeta);
router.get("/conversations/:id/messages", ctrl.getMessages);
router.get("/conversations/:id/access-log", ctrl.getAccessLog);
router.post("/conversations/:id/mediator-message", mediatorLimiter, validateMiddleware(mediatorMessageSchema), ctrl.sendMediatorMessage);
router.post("/conversations/:id/lock", validateMiddleware(lockSchema), ctrl.lockConversation);
router.post("/conversations/:id/unlock", ctrl.unlockConversation);
router.post("/conversations/:id/resolve", validateMiddleware(resolveSchema), ctrl.resolveConversationReports);

export default router;