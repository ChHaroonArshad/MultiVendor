import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { notificationsLimiter } from "../middleware/rateLimitMiddleware.js";
import * as notificationController from "../controllers/notificationController.js";

const router = Router();

// Any logged-in role has an inbox. The owner is always the JWT's userId.
router.use(authMiddleware, notificationsLimiter);

// Fixed paths first, then the /:id ones
router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.delete("/read", notificationController.clearRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);

export default router;