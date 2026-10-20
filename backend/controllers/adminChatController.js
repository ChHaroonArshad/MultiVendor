import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as adminChatService from "../services/adminChatService.js";

export const getStats = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 200, "Stats fetched", { stats: await adminChatService.getStats() });
});

export const listConversations = asyncHandler(async (req, res) => {
  const { filter, search, page, limit } = req.query;
  sendSuccessResponse(res, 200, "Conversations fetched", await adminChatService.listConversations({ filter, search, page, limit }));
});

export const listReports = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  sendSuccessResponse(res, 200, "Reports fetched", await adminChatService.listReports({ status, page, limit }));
});

export const getConversationMeta = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 200, "Conversation fetched", await adminChatService.getConversationMeta(req.user.userId, req.params.id));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { before, after, limit, reason } = req.query;
  sendSuccessResponse(res, 200, "Messages fetched", await adminChatService.getMessages(req.user.userId, req.params.id, { before, after, limit, reason }));
});

export const getAccessLog = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 200, "Access log fetched", await adminChatService.getAccessLog(req.user.userId, req.params.id));
});

export const sendMediatorMessage = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 201, "Message sent", await adminChatService.sendMediatorMessage(req.user.userId, req.params.id, req.body.text));
});

export const lockConversation = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 200, "Conversation closed", await adminChatService.lockConversation(req.user.userId, req.params.id, req.body.reason));
});

export const unlockConversation = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, 200, "Conversation reopened", await adminChatService.unlockConversation(req.user.userId, req.params.id));
});

export const resolveConversationReports = asyncHandler(async (req, res) => {
  const { outcome, note } = req.body;
  sendSuccessResponse(res, 200, "Reports resolved", await adminChatService.resolveConversationReports(req.user.userId, req.params.id, { outcome, note }));
});