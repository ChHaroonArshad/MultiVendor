import mongoose from "mongoose";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { createApiError } from "../utils/apiError.js";
import { sendAccountSuspendedEmail, sendAccountReactivatedEmail } from "./emailService.js";

const ROLES = ["customer", "seller", "admin"];
const STATUSES = ["active", "suspended"];
const SAFE_FIELDS = "name email role status isEmailVerified googleId suspensionReason suspendedAt createdAt";
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid user id");
}

// Raw user documents never go to the client: only what an admin screen needs.
function toAdminUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    signInMethod: user.googleId ? "Google" : "Email & password",
    suspensionReason: user.suspensionReason || null,
    suspendedAt: user.suspendedAt || null,
    createdAt: user.createdAt,
  };
}

export async function listUsers({ search, role, status, page, limit }) {
  const roleValue = asString(role) || "all";
  const statusValue = asString(status) || "all";
  const term = asString(search).trim().slice(0, MAX_SEARCH_LENGTH);

  if (roleValue !== "all" && !ROLES.includes(roleValue)) throw createApiError(400, "Invalid role filter");
  if (statusValue !== "all" && !STATUSES.includes(statusValue)) throw createApiError(400, "Invalid status filter");

  const filter = {};
  if (roleValue !== "all") filter.role = roleValue;
  if (statusValue !== "all") filter.status = statusValue;
  if (term) {
    const pattern = escapeRegex(term);
    filter.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 10));

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(SAFE_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(toAdminUser),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

export async function getUserStats() {
  const [total, customers, sellers, admins, suspended] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ status: "suspended" }),
  ]);
  return { total, customers, sellers, admins, suspended };
}

const totalCount = (rows) => rows.reduce((sum, r) => sum + r.count, 0);
const amountFor = (rows, key) => rows.find((r) => r._id === key)?.amount || 0;

async function getActivity(user) {
  const id = new mongoose.Types.ObjectId(user._id);
  const paidOrRefunded = { $in: ["paid", "refunded"] };
  const groupByPayment = { $group: { _id: "$paymentStatus", count: { $sum: 1 }, amount: { $sum: "$subtotal" } } };

  if (user.role === "seller") {
    const [productRows, orderRows] = await Promise.all([
      Product.aggregate([{ $match: { seller: id } }, { $group: { _id: "$approvalStatus", count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { seller: id, paymentStatus: paidOrRefunded } }, groupByPayment]),
    ]);
    const countOf = (status) => productRows.find((r) => r._id === status)?.count || 0;
    return {
      type: "seller",
      products: {
        total: totalCount(productRows),
        approved: countOf("approved"),
        pending: countOf("pending"),
        rejected: countOf("rejected"),
      },
      orders: totalCount(orderRows),
      revenue: amountFor(orderRows, "paid"), // refunded orders are not revenue
    };
  }

  if (user.role === "customer") {
    const orderRows = await Order.aggregate([{ $match: { buyer: id, paymentStatus: paidOrRefunded } }, groupByPayment]);
    return { type: "customer", orders: totalCount(orderRows), totalSpent: amountFor(orderRows, "paid") };
  }

  return { type: "admin" };
}

export async function getUserDetail(userId) {
  assertValidObjectId(userId);
  const user = await User.findById(userId).select(SAFE_FIELDS).lean();
  if (!user) throw createApiError(404, "User not found");
  return { user: toAdminUser(user), activity: await getActivity(user) };
}

export async function suspendUser(adminId, userId, reason) {
  assertValidObjectId(userId);
  if (String(adminId) === String(userId)) throw createApiError(400, "You cannot suspend your own account");

  const existing = await User.findById(userId).select("role status");
  if (!existing) throw createApiError(404, "User not found");
  if (existing.role === "admin") throw createApiError(403, "Admin accounts cannot be suspended");
  if (existing.status === "suspended") throw createApiError(409, "This account is already suspended");

  // Atomic: only succeeds if the account is still an active non-admin at this exact moment.
  const user = await User.findOneAndUpdate(
    { _id: userId, role: { $ne: "admin" }, status: "active" },
    { status: "suspended", suspensionReason: reason, suspendedAt: new Date() },
    { returnDocument: "after" }
  ).select(SAFE_FIELDS).lean();
  if (!user) throw createApiError(409, "This account was just updated. Please refresh.");

  // Kill every session so they cannot quietly refresh their way back in.
  await RefreshToken.deleteMany({ user: userId });

  // Best effort: a failed email must never undo the suspension itself.
  try {
    await sendAccountSuspendedEmail(user.email, user.name, reason);
  } catch (err) {
    console.error(`Failed to send suspension email to user ${userId}:`, err.message);
  }

  return toAdminUser(user);
}

export async function reactivateUser(userId) {
  assertValidObjectId(userId);

  const existing = await User.findById(userId).select("role status");
  if (!existing) throw createApiError(404, "User not found");
  if (existing.status !== "suspended") throw createApiError(409, "This account is not suspended");

  const user = await User.findOneAndUpdate(
    { _id: userId, status: "suspended" },
    { status: "active", suspensionReason: null, suspendedAt: null },
    { returnDocument: "after" }
  ).select(SAFE_FIELDS).lean();
  if (!user) throw createApiError(409, "This account was just updated. Please refresh.");

  try {
    await sendAccountReactivatedEmail(user.email, user.name);
  } catch (err) {
    console.error(`Failed to send reactivation email to user ${userId}:`, err.message);
  }

  return toAdminUser(user);
}