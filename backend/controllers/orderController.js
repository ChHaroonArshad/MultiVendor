import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as checkoutService from "../services/checkoutService.js";

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await checkoutService.getMyOrders(req.user.userId);
  sendSuccessResponse(res, 200, "Orders fetched", { orders });
});

export const getMyOrderGroup = asyncHandler(async (req, res) => {
  const order = await checkoutService.getMyOrderGroup(req.user.userId, req.params.orderGroupId);
  sendSuccessResponse(res, 200, "Order fetched", { order });
});