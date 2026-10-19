import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as reportService from "../services/reportService.js";

export const list = asyncHandler(async (req, res) => {
  const result = await reportService.listReports({
    status: req.query.status,
    type: req.query.type,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendSuccessResponse(res, 200, "Reports fetched", result);
});

export const stats = asyncHandler(async (req, res) => {
  const result = await reportService.getReportStats();
  sendSuccessResponse(res, 200, "Stats fetched", { stats: result });
});

export const get = asyncHandler(async (req, res) => {
  const result = await reportService.getReportById(req.params.id);
  sendSuccessResponse(res, 200, "Report fetched", result);
});

export const review = asyncHandler(async (req, res) => {
  const report = await reportService.startReview(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Review started", { report });
});

export const resolve = asyncHandler(async (req, res) => {
  const { outcome, note } = req.body;
  const report = await reportService.resolveReport(req.user.userId, req.params.id, { outcome, note });
  sendSuccessResponse(res, 200, outcome === "dismissed" ? "Report dismissed" : "Report resolved", { report });
});