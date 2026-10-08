import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { createApiError } from "../utils/apiError.js";

const STATUS_FILTERS = ["processing", "shipped", "delivered", "cancelled"];
const PAYMENT_FILTERS = ["paid", "unpaid", "refunded"];
const SELLER_FIELDS = "name";
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid order id");
}

export async function getMyOrders({ buyerId, status, paymentStatus, search, searchBy, page, limit }) {
  const statusValue = asString(status) || "all";
  const paymentValue = asString(paymentStatus) || "all";
  const searchByValue = asString(searchBy) || "orderId";
  const term = asString(search).trim().replace(/^#/, "").slice(0, MAX_SEARCH_LENGTH);

  if (statusValue !== "all" && statusValue !== "not-delivered" && !STATUS_FILTERS.includes(statusValue)) {
    throw createApiError(400, "Invalid status filter");
  }
  if (paymentValue !== "all" && !PAYMENT_FILTERS.includes(paymentValue)) {
    throw createApiError(400, "Invalid payment status filter");
  }
  if (!["orderId", "product"].includes(searchByValue)) {
    throw createApiError(400, "Invalid search type");
  }

  const filter = { buyer: buyerId };

  if (statusValue === "not-delivered") filter.status = { $in: ["processing", "shipped"] };
  else if (statusValue !== "all") filter.status = statusValue;

  if (paymentValue !== "all") filter.paymentStatus = paymentValue;

  if (term) {
    const pattern = escapeRegex(term);
    if (searchByValue === "product") {
      filter["items.name"] = { $regex: pattern, $options: "i" };
    } else {
      filter.$expr = { $regexMatch: { input: { $toString: "$_id" }, regex: pattern, options: "i" } };
    }
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 10));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("seller", SELLER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

export async function getMyOrderById(buyerId, orderId) {
  assertValidObjectId(orderId);
  const order = await Order.findOne({ _id: orderId, buyer: buyerId }).populate("seller", SELLER_FIELDS);
  if (!order) throw createApiError(404, "Order not found");
  return order;
}