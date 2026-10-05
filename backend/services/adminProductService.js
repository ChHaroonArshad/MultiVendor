import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";
import { sendProductRejectionEmail } from "./emailService.js";

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createApiError(400, "Invalid product id");
  }
}

export async function getAllProducts(statusFilter) {
  const query = {};
  if (statusFilter && statusFilter !== "all") {
    query.approvalStatus = statusFilter;
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

  product.approvalStatus = "approved";
  product.isPublished = true;
  product.rejectionReason = null;
  await product.save();
  return product;
}

export async function rejectProduct(productId, reason) {
  assertValidObjectId(productId);

  // populate seller here — this is the one call that needs the seller's
  // name/email to send the rejection notice
  const product = await Product.findById(productId).populate("seller", "name email");
  if (!product) throw createApiError(404, "Product not found");

  product.approvalStatus = "rejected";
  product.isPublished = false;
  product.rejectionReason = reason;
  await product.save();

  // Best-effort: a failed email should never undo or block the rejection
  // itself — the rejection already saved successfully above.
  if (product.seller?.email) {
    try {
      await sendProductRejectionEmail(product.seller.email, product.seller.name, product.name, reason);
    } catch (err) {
      console.error(`Failed to send rejection email for product ${product._id}:`, err.message);
    }
  }

  return product;
}