import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as inbox from "../services/inAppNotificationService.js";

// The recipient ALWAYS comes from the verified JWT. Query fields are listed one by one;
// never spread req.query next to a trusted id.
export const list = asyncHandler(async (req, res) => {
  const result = await inbox.listNotifications({
    userId: req.user.userId,
    status: req.query.status,
    category: req.query.category,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendSuccessResponse(res, 200, "Notifications fetched", result);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await inbox.countUnread(req.user.userId);
  sendSuccessResponse(res, 200, "Unread count fetched", { unreadCount: count });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await inbox.markRead(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Notification marked as read", result);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await inbox.markAllRead(req.user.userId);
  sendSuccessResponse(res, 200, "All notifications marked as read", result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await inbox.deleteNotification(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Notification deleted", result);
});

export const clearRead = asyncHandler(async (req, res) => {
  const result = await inbox.clearRead(req.user.userId);
  sendSuccessResponse(res, 200, "Read notifications cleared", result);
});