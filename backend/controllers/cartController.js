import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as cartService from "../services/cartService.js";

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.userId);
  sendSuccessResponse(res, 200, "Cart fetched", { cart });
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(req.user.userId, productId, quantity ?? 1);
  sendSuccessResponse(res, 200, "Item added to cart", { cart });
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user.userId, req.params.productId, req.body.quantity);
  sendSuccessResponse(res, 200, "Cart updated", { cart });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.userId, req.params.productId);
  sendSuccessResponse(res, 200, "Item removed", { cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.userId);
  sendSuccessResponse(res, 200, "Cart cleared", { cart });
});