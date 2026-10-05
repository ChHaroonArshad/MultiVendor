import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { createApiError } from "../utils/apiError.js";

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createApiError(400, "Invalid product id");
  }
}

// Every read goes through this — populates product details AND silently
// drops any line item whose product no longer exists or is no longer
// approved+published (seller deleted it, admin revoked it, etc.). This is
// the real-world equivalent of "item no longer available" cart cleanup.
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price originalPrice images stock approvalStatus isPublished seller",
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price originalPrice images stock approvalStatus isPublished seller",
    });
  }

  const validItems = cart.items.filter(
    (item) => item.product && item.product.approvalStatus === "approved" && item.product.isPublished
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return cart;
}

export async function getCart(userId) {
  return getOrCreateCart(userId);
}

export async function addItem(userId, productId, quantity) {
  assertValidObjectId(productId);

  const product = await Product.findOne({ _id: productId, approvalStatus: "approved", isPublished: true });
  if (!product) throw createApiError(404, "Product not available");

  const cart = await Cart.findOneAndUpdate({ user: userId }, {}, { upsert: true, new: true });

  const existing = cart.items.find((item) => item.product.toString() === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  // never let the cart silently hold more than the seller actually has
  const matchedItem = cart.items.find((item) => item.product.toString() === productId);
  if (matchedItem.quantity > product.stock) {
    matchedItem.quantity = product.stock;
  }

  await cart.save();
  return getOrCreateCart(userId);
}

export async function updateItemQuantity(userId, productId, quantity) {
  assertValidObjectId(productId);
  if (quantity < 1) throw createApiError(400, "Quantity must be at least 1");

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw createApiError(404, "Cart not found");

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw createApiError(404, "Item not in cart");

  const product = await Product.findById(productId);
  item.quantity = product ? Math.min(quantity, product.stock) : quantity;

  await cart.save();
  return getOrCreateCart(userId);
}

export async function removeItem(userId, productId) {
  assertValidObjectId(productId);

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw createApiError(404, "Cart not found");

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  return getOrCreateCart(userId);
}

export async function clearCart(userId) {
  const cart = await Cart.findOneAndUpdate({ user: userId }, { items: [] }, { upsert: true, new: true });
  return cart;
}