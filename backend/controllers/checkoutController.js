import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as checkoutService from "../services/checkoutService.js";

export const checkout = asyncHandler(async (req, res) => {
  const result = await checkoutService.createOrderFromCart(req.user.userId, req.body.shippingAddress);
  sendSuccessResponse(res, 201, "Order placed — complete payment to confirm", result);
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const orders = await checkoutService.confirmPaymentStatus(req.user.userId, req.params.orderGroupId);
  sendSuccessResponse(res, 200, "Payment status checked", { orders });
});

export const retryPayment = asyncHandler(async (req, res) => {
  const result = await checkoutService.retryPayment(req.user.userId, req.params.orderGroupId);
  sendSuccessResponse(res, 200, "Payment ready to retry", result);
});