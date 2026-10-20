import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { ChatReport } from "../models/ChatReport.js";
import { ChatAccessLog } from "../models/ChatAccessLog.js";
import { User } from "../models/User.js";
import { createApiError } from "../utils/apiError.js";
import { emitToBothSides, toConversationDTO, toMessageDTO, populateConversation } from "./chatService.js";

const MAX_LIMIT = 50;
const PREVIEW_LENGTH = 120;
const ACCESS_WINDOW_MS = 6 * 60 * 60 * 1000;
const PEOPLE = "name email avatar";
const REPORT_STATUSES = ["open", "resolved", "dismissed"];
const FILTERS = ["all", "reported", "locked", "blocked"];

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const person = (u) => (u ? { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || null } : null);

function assertValidObjectId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, `Invalid ${label}`);
}

async function requireAdmin(adminId) {
  const admin = await User.findOne({ _id: adminId, role: "admin", status: "active" }).select("name avatar").lean();
  if (!admin) throw createApiError(403, "Admin access required");
  return admin;
}

async function loadDirect(conversationId) {
  assertValidObjectId(conversationId, "conversation id");
  const conversation = await Conversation.findById(conversationId).populate("customer", PEOPLE).populate("seller", PEOPLE).lean();
  if (!conversation || conversation.type !== "direct") throw createApiError(404, "Conversation not found");
  return conversation;
}

const reasonRequired = (message) => createApiError(400, message, [{ field: "reason_required", message }]);

// The rule that makes monitoring accountable: with an open report an admin may open the chat directly,
// otherwise a written reason is required and recorded. Continuing to read needs a recent recorded opening.
async function assertAccess(adminId, conversationId, { reason, start }) {
  const hasOpenReport = await ChatReport.exists({ conversation: conversationId, status: "open" });

  if (start) {
    const clean = asString(reason).trim().slice(0, 300);
    if (!hasOpenReport && clean.length < 5) {
      throw reasonRequired("This is a private conversation. Tell us why you're opening it (at least 5 characters).");
    }
    await ChatAccessLog.create({ admin: adminId, conversation: conversationId, action: "view", reason: clean || "Open report" });
    return;
  }
  if (hasOpenReport) return;
  const recent = await ChatAccessLog.exists({
    admin: adminId, conversation: conversationId, createdAt: { $gte: new Date(Date.now() - ACCESS_WINDOW_MS) },
  });
  if (!recent) throw reasonRequired("Open this conversation again to continue.");
}

const logAction = (admin, conversationId, action, reason = "") =>
  ChatAccessLog.create({ admin, conversation: conversationId, action, reason: String(reason).slice(0, 300) });

function toMonitorConversation(c, openReports = 0) {
  const blockedBy = (c.blockedBy || []).map(String);
  return {
    _id: c._id,
    customer: person(c.customer),
    seller: person(c.seller),
    lastMessageAt: c.lastMessageAt,
    createdAt: c.createdAt,
    blocked: blockedBy.length > 0,
    locked: Boolean(c.lock?.at),
    lockReason: c.lock?.reason || "",
    lockedAt: c.lock?.at || null,
    openReports,
  };
}

function toAdminMessage(m) {
  return {
    _id: m._id,
    senderSide: m.senderSide,
    sender: m.sender ? { _id: m.sender._id, name: m.sender.name, avatar: m.sender.avatar || null } : null,
    type: m.type,
    text: m.text || "", // moderators see the text even if the sender deleted it
    image: m.image?.url || null,
    context: m.context ? { kind: m.context.kind, title: m.context.title, subtitle: m.context.subtitle, image: m.context.image } : null,
    edited: Boolean(m.editedAt),
    editHistory: (m.editHistory || []).map((e) => ({ text: e.text, at: e.at })),
    deleted: Boolean(m.deletedAt),
    createdAt: m.createdAt,
  };
}

async function postMediatorMessage(conversationId, admin, text) {
  const message = await Message.create({ conversation: conversationId, senderSide: "admin", sender: admin._id, type: "text", text });
  const updated = await populateConversation(
    Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          lastMessage: { messageId: message._id, type: "text", text: text.slice(0, PREVIEW_LENGTH), senderSide: "admin", deleted: false, at: message.createdAt },
          lastMessageAt: message.createdAt,
        },
        $inc: { "unread.customer": 1, "unread.seller": 1 },
      },
      { returnDocument: "after" }
    )
  );
  const dto = toMessageDTO({ ...message.toObject(), sender: { _id: admin._id, name: admin.name, avatar: admin.avatar } });
  emitToBothSides(updated, "message:new", (side, viewerId) => ({ message: dto, conversation: toConversationDTO(updated, side, viewerId) }));
  return { ...message.toObject(), sender: { _id: admin._id, name: admin.name, avatar: admin.avatar } };
}

// ---------- reads ----------

export async function getStats() {
  const [openReports, locked, direct] = await Promise.all([
    ChatReport.countDocuments({ status: "open" }),
    Conversation.countDocuments({ type: "direct", "lock.at": { $ne: null } }),
    Conversation.countDocuments({ type: "direct", lastMessageAt: { $ne: null } }),
  ]);
  return { openReports, locked, direct };
}

export async function listConversations({ filter, search, page, limit }) {
  const filterValue = asString(filter) || "all";
  if (!FILTERS.includes(filterValue)) throw createApiError(400, "Invalid filter");
  const term = asString(search).trim().slice(0, 100);

  const query = { type: "direct", lastMessageAt: { $ne: null } };
  if (filterValue === "reported") query._id = { $in: await ChatReport.distinct("conversation", { status: "open" }) };
  if (filterValue === "locked") query["lock.at"] = { $ne: null };
  if (filterValue === "blocked") query["blockedBy.0"] = { $exists: true };

  if (term) {
    const pattern = escapeRegex(term);
    const people = await User.find({ $or: [{ name: { $regex: pattern, $options: "i" } }, { email: { $regex: pattern, $options: "i" } }] })
      .select("_id").limit(200).lean();
    const ids = people.map((p) => p._id);
    query.$or = [{ customer: { $in: ids } }, { seller: { $in: ids } }];
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 15));

  const [rows, total] = await Promise.all([
    Conversation.find(query).select("customer seller lastMessageAt blockedBy lock createdAt")
      .populate("customer", PEOPLE).populate("seller", PEOPLE)
      .sort({ lastMessageAt: -1, _id: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Conversation.countDocuments(query),
  ]);

  const counts = await ChatReport.aggregate([
    { $match: { conversation: { $in: rows.map((r) => r._id) }, status: "open" } },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return {
    conversations: rows.map((r) => toMonitorConversation(r, countMap.get(String(r._id)) || 0)), // metadata only, never message text
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

const toReportDTO = (r) => ({
  _id: r._id,
  conversationId: r.conversation,
  category: r.category,
  details: r.details,
  status: r.status,
  createdAt: r.createdAt,
  reporterSide: r.reporterSide,
  reporter: person(r.reportedBy),
  against: person(r.against),
  resolution: { note: r.resolution?.note || "", at: r.resolution?.at || null },
});

export async function listReports({ status, page, limit }) {
  const statusValue = asString(status) || "open";
  if (statusValue !== "all" && !REPORT_STATUSES.includes(statusValue)) throw createApiError(400, "Invalid status");

  const query = statusValue === "all" ? {} : { status: statusValue };
  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 15));
  const sort = statusValue === "open" ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 }; // oldest open report first

  const [rows, total] = await Promise.all([
    ChatReport.find(query).populate("reportedBy", PEOPLE).populate("against", PEOPLE).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    ChatReport.countDocuments(query),
  ]);
  return {
    reports: rows.map(toReportDTO),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

export async function getConversationMeta(adminId, conversationId) {
  await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);
  const reports = await ChatReport.find({ conversation: conversation._id })
    .populate("reportedBy", PEOPLE).populate("against", PEOPLE).sort({ createdAt: -1 }).limit(20).lean();
  const openReports = reports.filter((r) => r.status === "open").length;
  return { conversation: toMonitorConversation(conversation, openReports), reports: reports.map(toReportDTO) };
}

export async function getMessages(adminId, conversationId, { before, after, limit, reason }) {
  const admin = await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);

  const beforeId = asString(before);
  const afterId = asString(after);
  await assertAccess(admin._id, conversation._id, { reason, start: !beforeId && !afterId });

  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 40));
  const filter = { conversation: conversation._id };

  if (afterId) {
    assertValidObjectId(afterId, "cursor");
    filter._id = { $gt: afterId };
    const rows = await Message.find(filter).sort({ _id: 1 }).limit(limitNum).populate("sender", "name avatar").lean();
    return { messages: rows.map(toAdminMessage), hasMore: false };
  }

  if (beforeId) {
    assertValidObjectId(beforeId, "cursor");
    filter._id = { $lt: beforeId };
  }
  const rows = await Message.find(filter).sort({ _id: -1 }).limit(limitNum + 1).populate("sender", "name avatar").lean();
  return { messages: rows.slice(0, limitNum).reverse().map(toAdminMessage), hasMore: rows.length > limitNum };
}

export async function getAccessLog(adminId, conversationId) {
  await requireAdmin(adminId);
  assertValidObjectId(conversationId, "conversation id");
  const rows = await ChatAccessLog.find({ conversation: conversationId }).populate("admin", "name").sort({ createdAt: -1 }).limit(50).lean();
  return { entries: rows.map((r) => ({ _id: r._id, action: r.action, reason: r.reason, admin: r.admin?.name || "Admin", createdAt: r.createdAt })) };
}

// ---------- actions ----------

export async function sendMediatorMessage(adminId, conversationId, text) {
  const admin = await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);
  await assertAccess(admin._id, conversation._id, { start: false });

  const message = await postMediatorMessage(conversation._id, admin, text);
  await logAction(admin._id, conversation._id, "mediator_message", text);
  return { message: toAdminMessage(message) };
}

export async function lockConversation(adminId, conversationId, reason) {
  const admin = await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);
  await assertAccess(admin._id, conversation._id, { start: false });

  const updated = await Conversation.findOneAndUpdate(
    { _id: conversation._id, "lock.at": null },
    { $set: { lock: { by: admin._id, reason, at: new Date() } } },
    { returnDocument: "after" }
  );
  if (!updated) throw createApiError(409, "This conversation is already closed");

  await postMediatorMessage(conversation._id, admin, `This conversation was closed by Marketplace Support. Reason: ${reason}`);
  await logAction(admin._id, conversation._id, "lock", reason);
  return { locked: true };
}

export async function unlockConversation(adminId, conversationId) {
  const admin = await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);
  await assertAccess(admin._id, conversation._id, { start: false });

  const updated = await Conversation.findOneAndUpdate(
    { _id: conversation._id, "lock.at": { $ne: null } },
    { $set: { lock: { by: null, reason: "", at: null } } },
    { returnDocument: "after" }
  );
  if (!updated) throw createApiError(409, "This conversation isn't closed");

  await postMediatorMessage(conversation._id, admin, "Marketplace Support has reopened this conversation. You can continue chatting.");
  await logAction(admin._id, conversation._id, "unlock");
  return { locked: false };
}

export async function resolveConversationReports(adminId, conversationId, { outcome, note }) {
  const admin = await requireAdmin(adminId);
  const conversation = await loadDirect(conversationId);
  await assertAccess(admin._id, conversation._id, { start: false });

  const result = await ChatReport.updateMany(
    { conversation: conversation._id, status: "open" },
    { $set: { status: outcome, resolution: { by: admin._id, note, at: new Date() } } }
  );
  if (result.modifiedCount === 0) throw createApiError(409, "There are no open reports on this conversation");

  await logAction(admin._id, conversation._id, "resolve_report", `${outcome}: ${note}`);
  return { resolved: result.modifiedCount };
}