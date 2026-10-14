import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as adminOverviewService from "../services/adminOverviewService.js";

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await adminOverviewService.getAdminOverview();
  sendSuccessResponse(res, 200, "Overview fetched", overview);
});