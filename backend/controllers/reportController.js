import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as reportService from "../services/reportService.js";

// The reporter always comes from the verified token; body fields are picked one by one.
export const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;
  const result = await reportService.createReport({ reporterId: req.user.userId, targetType, targetId, reason, details });
  sendSuccessResponse(res, 201, "Report submitted", result);
});

export const createSupportRequest = asyncHandler(async (req, res) => {
  const { category, message, name, email } = req.body;
  const result = await reportService.createSupportRequest({ viewerId: req.user?.userId, category, message, name, email });
  sendSuccessResponse(res, 201, "Message sent", result);
});