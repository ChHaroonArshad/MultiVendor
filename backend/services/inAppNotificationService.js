import mongoose from "mongoose";
import { Notification, NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES } from "../models/Notification.js";
import { createApiError } from "../utils/apiError.js";

const MAX_LIMIT = 50;
const PUBLIC_FIELDS = "-user -dedupeKey -__v";

const asString = (value) => (typeof value === "string" ? value : "");
const clip = (text, max) => String(text ?? "").slice(0, max);
const isInternalPath = (link) => typeof link === "string" && link.startsWith("/") && !link.startsWith("//");

function assertValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, "Invalid notification id");
}

// ---------- writing (called by the event notifiers) ----------

export async function createNotification({ userId, type, title, message, link = null, dedupeKey }) {
  const category = NOTIFICATION_TYPES[type];
  if (!category) throw new Error(`Unknown notification type: ${type}`);

  try { 
    await Notification.create({
      user: userId,
      type,
      category,
      title: clip(title, 120),
      message: clip(message, 400),
      link: isInternalPath(link) ? link : null,
      ...(dedupeKey ? { dedupeKey } : {}),
    });
  } catch (err) {
    if (err.code === 11000) return; // this event was already recorded
    throw err;
  }
}

// ---------- reading (the user's own inbox; every query is scoped to the user) ----------

export const countUnread = (userId) => Notification.countDocuments({ user: userId, readAt: null });

export async function listNotifications({ userId, status, category, page, limit }) {
  const statusValue = asString(status) || "all";
  const categoryValue = asString(category) || "all";

  if (!["all", "unread"].includes(statusValue)) throw createApiError(400, "Invalid status filter");
  if (categoryValue !== "all" && !NOTIFICATION_CATEGORIES.includes(categoryValue)) {
    throw createApiError(400, "Invalid category filter");
  }

  const filter = { user: userId };
  if (statusValue === "unread") filter.readAt = null;
  if (categoryValue !== "all") filter.category = categoryValue;

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 15));

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    countUnread(userId), // the badge always shows the TOTAL unread, whatever filter is active
  ]);

  return {
    notifications,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
    unreadCount,
  };
}

export async function markRead(userId, notificationId) {
  assertValidObjectId(notificationId);

  // Only an UNREAD notification matches, so reading twice is harmless.
  let notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId, readAt: null },
    { readAt: new Date() },
    { returnDocument: "after" }
  )
    .select(PUBLIC_FIELDS)
    .lean();

  if (!notification) {
    // Either it was already read, or it is not this user's. Tell the two apart.
    notification = await Notification.findOne({ _id: notificationId, user: userId }).select(PUBLIC_FIELDS).lean();
    if (!notification) throw createApiError(404, "Notification not found");
  }

  return { notification, unreadCount: await countUnread(userId) };
}

export async function markAllRead(userId) {
  const result = await Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
  return { updated: result.modifiedCount };
}

export async function deleteNotification(userId, notificationId) {
  assertValidObjectId(notificationId);
  const result = await Notification.deleteOne({ _id: notificationId, user: userId });
  if (result.deletedCount === 0) throw createApiError(404, "Notification not found");
  return { unreadCount: await countUnread(userId) };
}

export async function clearRead(userId) {
  const result = await Notification.deleteMany({ user: userId, readAt: { $ne: null } });
  return { deleted: result.deletedCount };
}