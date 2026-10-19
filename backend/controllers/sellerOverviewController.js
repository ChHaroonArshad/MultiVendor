import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as sellerOverviewService from "../services/sellerOverviewService.js";

export const getOverview = asyncHandler(async (req, res) => {
  const range = typeof req.query.range === "string" ? req.query.range : "7"; // whitelisted again in the service
  const overview = await sellerOverviewService.getSellerOverview(req.user.userId, range);
  sendSuccessResponse(res, 200, "Overview fetched", overview);
});