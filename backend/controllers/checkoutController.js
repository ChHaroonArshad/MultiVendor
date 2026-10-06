import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as checkoutService from "../services/checkoutService.js";

export const checkout = asyncHandler(async (req, res) => {
  const result = await checkoutService.createOrderFromCart(req.user.userId, req.body.shippingAddress);
  sendSuccessResponse(res, 201, "Order placed successfully", result);
});