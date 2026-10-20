import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as chatService from "../services/chatService.js";

export const listConversations = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await chatService.listConversations(req.user, { search, page, limit });
  sendSuccessResponse(res, 200, "Conversations fetched", result);
});

export const startConversation = asyncHandler(async (req, res) => {
  const { type, sellerId, customerId } = req.body;
  const result = await chatService.startConversation(req.user, { type, sellerId, customerId });
  sendSuccessResponse(res, 200, "Conversation ready", result);
});

export const getConversation = asyncHandler(async (req, res) => {
  const result = await chatService.getConversation(req.user, req.params.id);
  sendSuccessResponse(res, 200, "Conversation fetched", result);
});

export const listMessages = asyncHandler(async (req, res) => {
  const { before, limit } = req.query;
  const result = await chatService.listMessages(req.user, req.params.id, { before, limit });
  sendSuccessResponse(res, 200, "Messages fetched", result);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { text, clientId, contextKind, contextId } = req.body;
  const message = await chatService.sendMessage(req.user, req.params.id, {
    text, clientId, contextKind, contextId, file: req.file,
  });
  sendSuccessResponse(res, 201, "Message sent", { message });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await chatService.markRead(req.user, req.params.id);
  sendSuccessResponse(res, 200, "Marked as read", result);
});

export const blockConversation = asyncHandler(async (req, res) => {
  const result = await chatService.setBlocked(req.user, req.params.id, true);
  sendSuccessResponse(res, 200, "Blocked", result);
});

export const unblockConversation = asyncHandler(async (req, res) => {
  const result = await chatService.setBlocked(req.user, req.params.id, false);
  sendSuccessResponse(res, 200, "Unblocked", result);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const result = await chatService.deleteMessage(req.user, req.params.id);
  sendSuccessResponse(res, 200, "Message deleted", result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await chatService.getUnreadCount(req.user);
  sendSuccessResponse(res, 200, "Unread count fetched", result);
});
export const editMessage = asyncHandler(async (req, res) => {
  const result = await chatService.editMessage(req.user, req.params.id, { text: req.body.text });
  sendSuccessResponse(res, 200, "Message edited", result);
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const result = await chatService.deleteConversationForMe(req.user, req.params.id);
  sendSuccessResponse(res, 200, "Conversation deleted", result);
});

export const reportConversation = asyncHandler(async (req, res) => {
  const { category, details } = req.body;
  const result = await chatService.createReport(req.user, req.params.id, { category, details });
  sendSuccessResponse(res, 201, "Report sent", result);
});