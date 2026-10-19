import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as customerOverviewService from "../services/customerOverviewService.js";

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await customerOverviewService.getCustomerOverview(req.user.userId);
  sendSuccessResponse(res, 200, "Overview fetched", overview);
});