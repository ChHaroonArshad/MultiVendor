import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as customerOrderService from "../services/customerOrderService.js";

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await customerOrderService.getMyOrders({ buyerId: req.user.userId, ...req.query });
  sendSuccessResponse(res, 200, "Orders fetched", result);
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await customerOrderService.getMyOrderById(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Order fetched", { order });
});