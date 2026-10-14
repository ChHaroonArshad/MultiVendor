import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { stripe } from "../config/stripeConfig.js";
import { createApiError } from "../utils/apiError.js";
import { notifyCustomerOrderStatus } from "./notificationService.js";

// Sellers only ever see orders that were actually paid (or paid and later refunded).
const VISIBLE_PAYMENT_STATUSES = ["paid", "refunded"];
const STATUS_FILTERS = ["processing", "shipped", "delivered", "cancelled"];
const ALLOWED_TRANSITIONS = { processing: ["shipped", "cancelled"], shipped: ["delivered"] };
const BUYER_FIELDS = "name email avatar";
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid order id");
}

export async function getSellerOrders({ sellerId, status, search, searchBy, page, limit }) {
  const statusValue = asString(status) || "all";
  const searchByValue = asString(searchBy) || "orderId";
  const term = asString(search).trim().replace(/^#/, "").slice(0, MAX_SEARCH_LENGTH);

  if (statusValue !== "all" && statusValue !== "not-delivered" && !STATUS_FILTERS.includes(statusValue)) {
    throw createApiError(400, "Invalid status filter");
  }
  if (!["orderId", "product"].includes(searchByValue)) {
    throw createApiError(400, "Invalid search type");
  }

  const filter = { seller: sellerId, paymentStatus: { $in: VISIBLE_PAYMENT_STATUSES } };

  if (statusValue === "not-delivered") filter.status = { $in: ["processing", "shipped"] };
  else if (statusValue !== "all") filter.status = statusValue;

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
      .populate("buyer", BUYER_FIELDS)
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

export async function getSellerOrderById(sellerId, orderId) {
  assertValidObjectId(orderId);
  const order = await Order.findOne({
    _id: orderId,
    seller: sellerId,
    paymentStatus: { $in: VISIBLE_PAYMENT_STATUSES },
  }).populate("buyer", BUYER_FIELDS);
  if (!order) throw createApiError(404, "Order not found");
  return order;
}

async function cancelAndRefund(order) {
  if (!order.stripePaymentIntentId) {
    throw createApiError(400, "No payment found for this order, so it cannot be refunded");
  }

  // Refund FIRST. If Stripe refuses, the order stays untouched and the seller sees why.
  // The idempotency key means a double click or retry can never refund twice.
  let refund;
  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: order.stripePaymentIntentId,
        amount: Math.round(order.subtotal * 100), // only THIS seller's share of a multi-seller payment
        metadata: { orderId: order._id.toString() },
      },
      { idempotencyKey: `refund-order-${order._id}` }
    );
  } catch (err) {
    throw createApiError(502, `Refund failed, so the order was not cancelled: ${err.message}`);
  }

  // Atomic claim: only one request gets to flip processing -> cancelled and restore stock.
  const cancelled = await Order.findOneAndUpdate(
    { _id: order._id, status: "processing", paymentStatus: "paid" },
    { status: "cancelled", paymentStatus: "refunded", stripeRefundId: refund.id },
    { returnDocument: "after" }
  );
  if (!cancelled) throw createApiError(409, "This order was just updated. Please refresh.");

  await Promise.all(
    cancelled.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    )
  );

  const populated = await cancelled.populate("buyer", BUYER_FIELDS);
  notifyCustomerOrderStatus(populated, "cancelled"); // not awaited: a mail failure must not undo a refund
  return populated;
}

export async function updateOrderStatus(sellerId, orderId, nextStatus) {
  assertValidObjectId(orderId);

  const order = await Order.findOne({
    _id: orderId,
    seller: sellerId,
    paymentStatus: { $in: VISIBLE_PAYMENT_STATUSES },
  });
  if (!order) throw createApiError(404, "Order not found");

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw createApiError(400, `An order that is ${order.status} cannot be changed to ${nextStatus}`);
  }
  if (order.paymentStatus !== "paid") {
    throw createApiError(400, "Only paid orders can be updated");
  }

  if (nextStatus === "cancelled") return cancelAndRefund(order);

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status, paymentStatus: "paid" },
    { status: nextStatus },
    { returnDocument: "after" }
  ).populate("buyer", BUYER_FIELDS);
  if (!updated) throw createApiError(409, "This order was just updated. Please refresh.");

  notifyCustomerOrderStatus(updated, nextStatus); // shipped or delivered, respects the customer's switch
  return updated;
}

export async function getSellerOrderStats(sellerId) {
  const rows = await Order.aggregate([
    {
      $match: {
        seller: new mongoose.Types.ObjectId(sellerId),
        paymentStatus: { $in: VISIBLE_PAYMENT_STATUSES },
      },
    },
    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$subtotal" } } },
  ]);

  const countOf = (status) => rows.find((r) => r._id === status)?.count || 0;

  return {
    total: rows.reduce((sum, r) => sum + r.count, 0),
    processing: countOf("processing"),
    shipped: countOf("shipped"),
    delivered: countOf("delivered"),
    cancelled: countOf("cancelled"),
    revenue: rows.filter((r) => r._id !== "cancelled").reduce((sum, r) => sum + r.amount, 0),
  };
}