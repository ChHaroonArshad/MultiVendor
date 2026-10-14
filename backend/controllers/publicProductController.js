import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as productService from "../services/productService.js";

export const listPublicProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPublicProducts(req.query);
  sendSuccessResponse(res, 200, "Products fetched", result);
});

export const getPublicProduct = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductById(req.params.id);
  sendSuccessResponse(res, 200, "Product fetched", { product });
});