import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import { getPublicStats } from "../services/publicStatsService.js";

export const stats = asyncHandler(async (req, res) => {
  const result = await getPublicStats();
  res.set("Cache-Control", "public, max-age=60"); // marketing numbers do not need to be live to the second
  sendSuccessResponse(res, 200, "Stats fetched", result);
});