import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { handleChatImageUpload } from "../middleware/chatUploadMiddleware.js";
import { startConversationSchema, sendMessageSchema } from "../validators/chatValidator.js";
import { createApiError } from "../utils/apiError.js";
import * as chatController from "../controllers/chatController.js";

const router = Router();

const perUser = (req) => String(req.user?.userId || "anonymous");

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: perUser,
  handler: (req, res, next) => next(createApiError(429, "You're sending messages too fast. Please slow down.")),
});

const startLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: perUser,
  handler: (req, res, next) => next(createApiError(429, "Too many new chats. Please try again later.")),
});

router.use(authMiddleware, roleMiddleware(["customer", "seller", "admin"]));

router.get("/unread-count", chatController.getUnreadCount);

router.get("/conversations", chatController.listConversations);
router.post("/conversations", startLimiter, validateMiddleware(startConversationSchema), chatController.startConversation);
router.get("/conversations/:id", chatController.getConversation);
router.get("/conversations/:id/messages", chatController.listMessages);
router.post(
  "/conversations/:id/messages",
  sendLimiter,
  handleChatImageUpload,
  validateMiddleware(sendMessageSchema),
  chatController.sendMessage
);
router.post("/conversations/:id/read", chatController.markRead);
router.post("/conversations/:id/block", chatController.blockConversation);
router.delete("/conversations/:id/block", chatController.unblockConversation);

router.delete("/messages/:id", chatController.deleteMessage);

export default router;