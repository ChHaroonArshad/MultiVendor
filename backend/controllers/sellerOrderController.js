import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as sellerOrderService from "../services/sellerOrderService.js";

export const getSellerOrders = asyncHandler(async (req, res) => {
  const result = await sellerOrderService.getSellerOrders({ sellerId: req.user.userId, ...req.query });
  sendSuccessResponse(res, 200, "Orders fetched", result); // { orders, pagination }
});

export const getSellerOrder = asyncHandler(async (req, res) => {
  const order = await sellerOrderService.getSellerOrderById(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Order fetched", { order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await sellerOrderService.updateOrderStatus(req.user.userId, req.params.id, req.body.status);
  sendSuccessResponse(res, 200, "Order status updated", { order });
});

export const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await sellerOrderService.getSellerOrderStats(req.user.userId);
  sendSuccessResponse(res, 200, "Stats fetched", { stats });
});