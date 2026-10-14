import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";
import { notifySellerProductDecision } from "./notificationService.js";

const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createApiError(400, "Invalid product id");
  }
}

export async function getAllProducts(statusFilter) {
  const query = {};
  if (typeof statusFilter === "string" && APPROVAL_STATUSES.includes(statusFilter)) {
    query.approvalStatus = statusFilter; // anything else (including query-string objects) is ignored
  }
  return Product.find(query).populate("seller", "name email").sort({ createdAt: -1 });
}

export async function getProductById(productId) {
  assertValidObjectId(productId);
  const product = await Product.findById(productId).populate("seller", "name email");
  if (!product) throw createApiError(404, "Product not found");
  return product;
}

export async function approveProduct(productId) {
  assertValidObjectId(productId);
  const product = await Product.findById(productId);
  if (!product) throw createApiError(404, "Product not found");

  const wasApproved = product.approvalStatus === "approved";

  product.approvalStatus = "approved";
  product.isPublished = true;
  product.rejectionReason = null;
  await product.save();

  if (!wasApproved) notifySellerProductDecision(product, "approved"); // not awaited on purpose
  return product;
}

export async function rejectProduct(productId, reason) {
  assertValidObjectId(productId);

  const product = await Product.findById(productId).populate("seller", "name email");
  if (!product) throw createApiError(404, "Product not found");

  product.approvalStatus = "rejected";
  product.isPublished = false;
  product.rejectionReason = reason;
  await product.save();

  notifySellerProductDecision(product, "rejected", reason); // respects the seller's "Product Notifications" switch
  return product;
}