import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as wishlistService from "../services/wishlistService.js";

// The owner is always the verified JWT; query fields are listed one by one.
export const ids = asyncHandler(async (req, res) => {
  const result = await wishlistService.getWishlistIds(req.user.userId);
  sendSuccessResponse(res, 200, "Wishlist ids fetched", { ids: result });
});

export const list = asyncHandler(async (req, res) => {
  const result = await wishlistService.listWishlist({
    userId: req.user.userId,
    search: req.query.search,
    sort: req.query.sort,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendSuccessResponse(res, 200, "Wishlist fetched", result);
});

export const add = asyncHandler(async (req, res) => {
  const result = await wishlistService.addItem(req.user.userId, req.body.productId);
  sendSuccessResponse(res, 200, "Added to wishlist", result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await wishlistService.removeItem(req.user.userId, req.params.productId);
  sendSuccessResponse(res, 200, "Removed from wishlist", result);
});

export const clear = asyncHandler(async (req, res) => {
  const result = await wishlistService.clearWishlist(req.user.userId);
  sendSuccessResponse(res, 200, "Wishlist cleared", result);
});