import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { createApiError } from "../utils/apiError.js";

const STATUS_FILTERS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_FILTERS = ["paid", "unpaid", "refunded"];
const SEARCH_TYPES = ["orderId", "product", "customer", "seller"];
const USER_FIELDS = "name email avatar";
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_MATCHED_USERS = 200;

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid order id");
}

// Order stores only ObjectIds, never names. To search by a person's name we first
// find the matching users, then filter orders by those ids.
async function findUserIdsByName(pattern, role) {
  const users = await User.find({ name: { $regex: pattern, $options: "i" }, role })
    .select("_id")
    .limit(MAX_MATCHED_USERS)
    .lean();
  return users.map((u) => u._id);
}

export async function getAdminOrders({ status, paymentStatus, search, searchBy, page, limit }) {
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
  if (!SEARCH_TYPES.includes(searchByValue)) {
    throw createApiError(400, "Invalid search type");
  }

  // No owner field here on purpose: the admin sees the whole platform.
  // The only protection is roleMiddleware(["admin"]) on the router.
  const filter = {};

  if (statusValue === "not-delivered") filter.status = { $in: ["processing", "shipped"] };
  else if (statusValue !== "all") filter.status = statusValue;

  if (paymentValue !== "all") filter.paymentStatus = paymentValue;

  if (term) {
    const pattern = escapeRegex(term);

    if (searchByValue === "product") {
      filter["items.name"] = { $regex: pattern, $options: "i" };
    } else if (searchByValue === "customer") {
      filter.buyer = { $in: await findUserIdsByName(pattern, "customer") };
    } else if (searchByValue === "seller") {
      filter.seller = { $in: await findUserIdsByName(pattern, "seller") };
    } else {
      filter.$expr = { $regexMatch: { input: { $toString: "$_id" }, regex: pattern, options: "i" } };
    }
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 10));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", USER_FIELDS)
      .populate("seller", USER_FIELDS)
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

export async function getAdminOrderById(orderId) {
  assertValidObjectId(orderId);

  const order = await Order.findById(orderId)
    .populate("buyer", USER_FIELDS)
    .populate("seller", USER_FIELDS);
  if (!order) throw createApiError(404, "Order not found");

  // Other seller-slices created by the same checkout (same payment, same buyer).
  const siblings = await Order.find({ orderGroupId: order.orderGroupId, _id: { $ne: order._id } })
    .select("seller status paymentStatus subtotal createdAt")
    .populate("seller", "name")
    .sort({ createdAt: 1 });

  return { order, siblings };
}

export async function getAdminOrderStats() {
  const rows = await Order.aggregate([
    {
      $group: {
        _id: { status: "$status", paymentStatus: "$paymentStatus" },
        count: { $sum: 1 },
        amount: { $sum: "$subtotal" },
      },
    },
  ]);

  const sum = (predicate, key) => rows.filter((r) => predicate(r._id)).reduce((total, r) => total + r[key], 0);

  return {
    total: sum(() => true, "count"),
    awaitingPayment: sum((id) => id.status === "pending" && id.paymentStatus === "unpaid", "count"),
    processing: sum((id) => id.status === "processing", "count"),
    shipped: sum((id) => id.status === "shipped", "count"),
    delivered: sum((id) => id.status === "delivered", "count"),
    cancelled: sum((id) => id.status === "cancelled", "count"),
    revenue: sum((id) => id.paymentStatus === "paid", "amount"),
    refunded: sum((id) => id.paymentStatus === "refunded", "amount"),
  };
}