import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as adminOrderService from "../services/adminOrderService.js";

export const getOrders = asyncHandler(async (req, res) => {
  const result = await adminOrderService.getAdminOrders(req.query);
  sendSuccessResponse(res, 200, "Orders fetched", result); // { orders, pagination }
});

export const getOrder = asyncHandler(async (req, res) => {
  const result = await adminOrderService.getAdminOrderById(req.params.id);
  sendSuccessResponse(res, 200, "Order fetched", result); // { order, siblings }
});

export const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await adminOrderService.getAdminOrderStats();
  sendSuccessResponse(res, 200, "Stats fetched", { stats });
});