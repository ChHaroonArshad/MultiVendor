import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as adminProductService from "../services/adminProductService.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await adminProductService.getAllProducts(req.query.status);
  sendSuccessResponse(res, 200, "Products fetched", { products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.getProductById(req.params.id);
  sendSuccessResponse(res, 200, "Product fetched", { product });
});

export const approveProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.approveProduct(req.params.id);
  sendSuccessResponse(res, 200, "Product approved and published", { product });
});

export const rejectProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.rejectProduct(req.params.id, req.body.reason);
  sendSuccessResponse(res, 200, "Product rejected", { product });
});