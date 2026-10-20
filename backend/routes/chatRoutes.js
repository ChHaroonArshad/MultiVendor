import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { handleChatImageUpload } from "../middleware/chatUploadMiddleware.js";
import { startConversationSchema, sendMessageSchema, editMessageSchema, reportConversationSchema } from "../validators/chatValidator.js";
import { createApiError } from "../utils/apiError.js";
import * as chatController from "../controllers/chatController.js";

const router = Router();

const perUser = (req) => String(req.user?.userId || "anonymous");
const limiter = (windowMs, max, message) =>
  rateLimit({
    windowMs, max, standardHeaders: true, legacyHeaders: false, keyGenerator: perUser,
    handler: (req, res, next) => next(createApiError(429, message)),
  });

const sendLimiter = limiter(60 * 1000, 40, "You're sending messages too fast. Please slow down.");
const startLimiter = limiter(60 * 60 * 1000, 30, "Too many new chats. Please try again later.");
const reportLimiter = limiter(60 * 60 * 1000, 10, "Too many reports. Please try again later.");

router.use(authMiddleware, roleMiddleware(["customer", "seller", "admin"]));

router.get("/unread-count", chatController.getUnreadCount);

router.get("/conversations", chatController.listConversations);
router.post("/conversations", startLimiter, validateMiddleware(startConversationSchema), chatController.startConversation);
router.get("/conversations/:id", chatController.getConversation);
router.delete("/conversations/:id", chatController.deleteConversation);
router.get("/conversations/:id/messages", chatController.listMessages);
router.post("/conversations/:id/messages", sendLimiter, handleChatImageUpload, validateMiddleware(sendMessageSchema), chatController.sendMessage);
router.post("/conversations/:id/read", chatController.markRead);
router.post("/conversations/:id/block", chatController.blockConversation);
router.delete("/conversations/:id/block", chatController.unblockConversation);
router.post("/conversations/:id/report", reportLimiter, validateMiddleware(reportConversationSchema), chatController.reportConversation);

router.patch("/messages/:id", sendLimiter, validateMiddleware(editMessageSchema), chatController.editMessage);
router.delete("/messages/:id", chatController.deleteMessage);

export default router;