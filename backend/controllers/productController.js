import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import * as productService from "../services/productService.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct({
    sellerId: req.user.userId,
    data: req.body,
    files: req.files,
  });
  sendSuccessResponse(res, 201, "Product submitted for approval", { product });
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.userId);
  sendSuccessResponse(res, 200, "Products fetched", { products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Product fetched", { product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct({
    sellerId: req.user.userId,
    productId: req.params.id,
    data: req.body,
    files: req.files,
  });
  sendSuccessResponse(res, 200, "Product updated", { product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.user.userId, req.params.id);
  sendSuccessResponse(res, 200, "Product deleted", null);
});

export const togglePublish = asyncHandler(async (req, res) => {
  const product = await productService.setPublishStatus(req.user.userId, req.params.id, req.body.isPublished);
  sendSuccessResponse(res, 200, product.isPublished ? "Product published" : "Product unpublished", { product });
});