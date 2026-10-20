import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { ChatReport } from "../models/ChatReport.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { createApiError } from "../utils/apiError.js";
import { getSide, otherSideOf, idOf } from "../utils/chatSides.js";
import { emitToSide, isUserOnline, isSideOnline } from "../socket/socketServer.js";

const MAX_LIMIT = 50;
const PREVIEW_LENGTH = 120;
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const PEOPLE_FIELDS = "name avatar";

const asString = (value) => (typeof value === "string" ? value : "");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const orderCode = (id) => String(id).slice(-6).toUpperCase();
const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;

function assertValidObjectId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(400, `Invalid ${label}`);
}

async function requireActiveUser(userId) {
  const user = await User.findOne({ _id: userId, status: "active" }).select("name avatar role").lean();
  if (!user) throw createApiError(403, "Your account can't use chat right now");
  return user;
}

export const populateConversation = (query) => query.populate("customer", PEOPLE_FIELDS).populate("seller", PEOPLE_FIELDS);

const participantIdsOf = (conversation) =>
  (conversation.type === "direct" ? [conversation.customer, conversation.seller] : [conversation.seller]).map(
    (p) => new mongoose.Types.ObjectId(idOf(p))
  );

// ---------- DTOs ----------

function counterpartFor(conversation, side) {
  if (conversation.type === "direct") {
    const other = side === "customer" ? conversation.seller : conversation.customer;
    return {
      _id: idOf(other),
      name: other?.name || "Deleted user",
      avatar: other?.avatar || null,
      role: side === "customer" ? "seller" : "customer",
      online: isUserOnline(idOf(other)),
    };
  }
  if (side === "seller") return { _id: null, name: "Marketplace Support", avatar: null, role: "support", online: false };
  return {
    _id: idOf(conversation.seller),
    name: conversation.seller?.name || "Deleted user",
    avatar: conversation.seller?.avatar || null,
    role: "seller",
    online: false,
  };
}

export function toConversationDTO(conversation, side, viewerId) {
  const last = conversation.lastMessage;
  const blockedBy = (conversation.blockedBy || []).map(String);
  return {
    _id: conversation._id,
    type: conversation.type,
    mySide: side,
    counterpart: counterpartFor(conversation, side),
    lastMessage: last
      ? { type: last.type, text: last.text, deleted: Boolean(last.deleted), senderSide: last.senderSide, isMine: last.senderSide === side, at: last.at }
      : null,
    lastMessageAt: conversation.lastMessageAt,
    unread: conversation.unread?.[side] || 0,
    blocked: blockedBy.length > 0,
    blockedByMe: viewerId ? blockedBy.includes(String(viewerId)) : false,
    canBlock: conversation.type === "direct",
    locked: Boolean(conversation.lock?.at),
    lockReason: conversation.lock?.reason || "",
  };
}

export function toMessageDTO(message) {
  const deleted = Boolean(message.deletedAt);
  return {
    _id: message._id,
    conversation: message.conversation,
    clientId: message.clientId || null,
    senderSide: message.senderSide,
    sender: message.sender
      ? { _id: idOf(message.sender), name: message.sender.name || "User", avatar: message.sender.avatar || null }
      : null,
    type: message.type,
    text: deleted ? "" : message.text,
    image: deleted ? null : message.image?.url || null,
    context:
      deleted || !message.context
        ? null
        : { kind: message.context.kind, refId: message.context.refId, title: message.context.title, subtitle: message.context.subtitle, image: message.context.image },
    deliveredAt: message.deliveredAt || null,
    readAt: message.readAt || null,
    edited: Boolean(message.editedAt) && !deleted,
    deleted,
    createdAt: message.createdAt,
  };
}

export function emitToBothSides(conversation, event, build) {
  const sides = conversation.type === "direct" ? ["customer", "seller"] : ["seller", "admin"];
  for (const side of sides) {
    const viewerId = side === "admin" ? null : idOf(conversation[side]);
    emitToSide(conversation, side, event, build(side, viewerId));
  }
}

// ---------- access ----------

async function loadConversation(me, conversationId) {
  assertValidObjectId(conversationId, "conversation id");
  const conversation = await populateConversation(Conversation.findById(conversationId));
  if (!conversation) throw createApiError(404, "Conversation not found");

  const side = getSide(conversation, { userId: String(me._id), role: me.role });
  if (!side) throw createApiError(404, "Conversation not found"); // not a member = same answer as "does not exist"
  return { conversation, side };
}

// ---------- conversations ----------

export async function listConversations(user, { search, page, limit }) {
  const me = await requireActiveUser(user.userId);
  const term = asString(search).trim().slice(0, 100);

  const base =
    me.role === "customer"
      ? { type: "direct", customer: me._id }
      : me.role === "seller"
      ? { seller: me._id }
      : { type: "support" };
  const filter = { ...base, lastMessageAt: { $ne: null }, hiddenFor: { $ne: me._id } };

  if (term) {
    const pattern = escapeRegex(term);
    const people = await User.find({ name: { $regex: pattern, $options: "i" } }).select("_id").limit(200).lean();
    const ids = people.map((p) => p._id).filter((id) => String(id) !== String(me._id));
    const clauses = [{ customer: { $in: ids } }, { seller: { $in: ids } }];
    if (me.role === "seller" && /support/i.test(term)) clauses.push({ type: "support" });
    filter.$or = clauses;
  }

  const pageNum = Math.max(1, parseInt(asString(page), 10) || 1);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 20));

  const [rows, total] = await Promise.all([
    populateConversation(
      Conversation.find(filter).sort({ lastMessageAt: -1, _id: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum)
    ),
    Conversation.countDocuments(filter),
  ]);

  return {
    conversations: rows.map((c) => toConversationDTO(c, getSide(c, { userId: String(me._id), role: me.role }), me._id)),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}

async function upsertConversation({ key, type, customer, seller }) {
  const run = () =>
    populateConversation(
      Conversation.findOneAndUpdate({ key }, { $setOnInsert: { key, type, customer, seller } }, { upsert: true, returnDocument: "after" })
    );
  try {
    return await run();
  } catch (err) {
    if (err?.code === 11000) return run();
    throw err;
  }
}

export async function startConversation(user, { type, sellerId, customerId }) {
  const me = await requireActiveUser(user.userId);
  let conversation;

  if (type === "direct") {
    if (me.role === "customer") {
      if (!sellerId) throw createApiError(400, "sellerId is required");
      const seller = await User.findOne({ _id: sellerId, role: "seller", status: "active" }).select("_id").lean();
      if (!seller) throw createApiError(404, "Seller not found");
      conversation = await upsertConversation({ key: `direct:${me._id}:${seller._id}`, type: "direct", customer: me._id, seller: seller._id });
    } else if (me.role === "seller") {
      if (!customerId) throw createApiError(400, "customerId is required");
      const hadOrder = await Order.exists({ seller: me._id, buyer: customerId, paymentStatus: { $in: ["paid", "refunded"] } });
      if (!hadOrder) throw createApiError(403, "You can only message customers who have ordered from you");
      const customer = await User.findOne({ _id: customerId, role: "customer", status: "active" }).select("_id").lean();
      if (!customer) throw createApiError(404, "Customer not found");
      conversation = await upsertConversation({ key: `direct:${customer._id}:${me._id}`, type: "direct", customer: customer._id, seller: me._id });
    } else {
      throw createApiError(403, "Admins can only message sellers through support chat");
    }
  } else if (me.role === "seller") {
    conversation = await upsertConversation({ key: `support:${me._id}`, type: "support", customer: null, seller: me._id });
  } else if (me.role === "admin") {
    if (!sellerId) throw createApiError(400, "sellerId is required");
    const seller = await User.findOne({ _id: sellerId, role: "seller" }).select("_id").lean();
    if (!seller) throw createApiError(404, "Seller not found");
    conversation = await upsertConversation({ key: `support:${seller._id}`, type: "support", customer: null, seller: seller._id });
  } else {
    throw createApiError(403, "Customers can only chat with sellers");
  }

  // opening a chat you had deleted brings it back (its old history stays cleared)
  if ((conversation.hiddenFor || []).some((id) => String(id) === String(me._id))) {
    await Conversation.updateOne({ _id: conversation._id }, { $pull: { hiddenFor: me._id } });
  }

  const side = getSide(conversation, { userId: String(me._id), role: me.role });
  return { conversation: toConversationDTO(conversation, side, me._id) };
}

export async function getConversation(user, conversationId) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);
  return { conversation: toConversationDTO(conversation, side, me._id) };
}

// ---------- messages ----------

export async function listMessages(user, conversationId, { before, limit }) {
  const me = await requireActiveUser(user.userId);
  const { conversation } = await loadConversation(me, conversationId);

  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(asString(limit), 10) || 30));
  const filter = { conversation: conversation._id };

  const cleared = (conversation.clears || []).find((c) => idOf(c.user) === String(me._id));
  if (cleared) filter.createdAt = { $gt: cleared.at }; // history before "delete conversation" stays hidden

  const beforeId = asString(before);
  if (beforeId) {
    assertValidObjectId(beforeId, "cursor");
    filter._id = { $lt: beforeId };
  }

  const rows = await Message.find(filter).sort({ _id: -1 }).limit(limitNum + 1).populate("sender", PEOPLE_FIELDS).lean();
  const hasMore = rows.length > limitNum;
  return { messages: rows.slice(0, limitNum).reverse().map(toMessageDTO), hasMore };
}

async function buildContext({ kind, id, conversation }) {
  if (kind === "product") {
    const product = await Product.findOne({ _id: id, approvalStatus: "approved", isPublished: true }).select("name price images seller").lean();
    if (!product || idOf(product.seller) !== idOf(conversation.seller)) throw createApiError(400, "That product doesn't belong to this seller");
    return { kind: "product", refId: product._id, title: product.name, subtitle: money(product.price), image: product.images?.[0]?.url || "" };
  }
  if (conversation.type !== "direct") throw createApiError(400, "Orders can only be shared in a buyer-seller chat");
  const order = await Order.findOne({ _id: id, seller: conversation.seller._id, buyer: conversation.customer._id }).select("subtotal status").lean();
  if (!order) throw createApiError(400, "That order doesn't belong to this conversation");
  return { kind: "order", refId: order._id, title: `Order #${orderCode(order._id)}`, subtitle: `${order.status} · ${money(order.subtotal)}`, image: "" };
}

export async function sendMessage(user, conversationId, { text, clientId, contextKind, contextId, file }) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);

  if (conversation.lock?.at) throw createApiError(403, "This conversation was closed by Marketplace Support");
  if ((conversation.blockedBy || []).length > 0) throw createApiError(403, "This conversation is closed for replies");

  if (conversation.type === "direct") {
    const otherId = idOf(side === "customer" ? conversation.seller : conversation.customer);
    if (!(await User.exists({ _id: otherId, status: "active" }))) throw createApiError(403, "This user is no longer available");
  }

  const body = String(text || "").trim();
  if (!body && !file) throw createApiError(400, "Write a message or attach an image");

  const findExisting = () =>
    clientId ? Message.findOne({ conversation: conversation._id, clientId }).populate("sender", PEOPLE_FIELDS).lean() : null;
  const already = await findExisting();
  if (already) return toMessageDTO(already);

  const context = contextKind ? await buildContext({ kind: contextKind, id: contextId, conversation }) : undefined;

  let image;
  if (file) {
    try {
      const result = await uploadBufferToCloudinary(file.buffer, "marketplace/chat");
      image = { url: result.secure_url, publicId: result.public_id };
    } catch {
      throw createApiError(400, "The image could not be uploaded. Please try another one.");
    }
  }

  const recipientSide = otherSideOf(conversation, side);

  let message;
  try {
    message = await Message.create({
      conversation: conversation._id, senderSide: side, sender: me._id,
      type: image ? "image" : "text", text: body, image, context, clientId,
      deliveredAt: isSideOnline(conversation, recipientSide) ? new Date() : null,
    });
  } catch (err) {
    if (image) await deleteFromCloudinary(image.publicId);
    if (err?.code === 11000) {
      const raced = await findExisting();
      if (raced) return toMessageDTO(raced);
    }
    throw err;
  }

  const updated = await populateConversation(
    Conversation.findByIdAndUpdate(
      conversation._id,
      {
        $set: {
          lastMessage: { messageId: message._id, type: message.type, text: body.slice(0, PREVIEW_LENGTH), senderSide: side, deleted: false, at: message.createdAt },
          lastMessageAt: message.createdAt,
        },
        $inc: { [`unread.${recipientSide}`]: 1 },
        $pull: { hiddenFor: { $in: participantIdsOf(conversation) } }, // a new message brings a deleted chat back
      },
      { returnDocument: "after" }
    )
  );

  const dto = toMessageDTO({ ...message.toObject(), sender: { _id: me._id, name: me.name, avatar: me.avatar } });
  emitToBothSides(updated, "message:new", (s, viewerId) => ({ message: dto, conversation: toConversationDTO(updated, s, viewerId) }));
  return dto;
}

export async function markRead(user, conversationId) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);

  const now = new Date();
  const incoming = { conversation: conversation._id, senderSide: { $ne: side } }; // everything not sent by my side (mediator messages included)
  await Message.updateMany({ ...incoming, deliveredAt: null }, { $set: { deliveredAt: now } }); // seen implies delivered
  const result = await Message.updateMany({ ...incoming, readAt: null }, { $set: { readAt: now } });

  const hadUnread = (conversation.unread?.[side] || 0) > 0;
  if (hadUnread) await Conversation.updateOne({ _id: conversation._id }, { $set: { [`unread.${side}`]: 0 } });

  if (result.modifiedCount > 0 || hadUnread) {
    emitToBothSides(conversation, "messages:read", () => ({ conversationId: String(conversation._id), readerSide: side, at: now }));
  }
  return { updated: result.modifiedCount };
}

export async function setBlocked(user, conversationId, blocked) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);
  if (conversation.type !== "direct") throw createApiError(400, "Support conversations can't be blocked");

  const update = blocked ? { $addToSet: { blockedBy: me._id } } : { $pull: { blockedBy: me._id } };
  const updated = await populateConversation(Conversation.findByIdAndUpdate(conversation._id, update, { returnDocument: "after" }));

  emitToBothSides(updated, "conversation:update", (s, viewerId) => ({ conversation: toConversationDTO(updated, s, viewerId) }));
  return { conversation: toConversationDTO(updated, side, me._id) };
}

export async function editMessage(user, messageId, { text }) {
  const me = await requireActiveUser(user.userId);
  assertValidObjectId(messageId, "message id");

  const message = await Message.findOne({ _id: messageId, sender: me._id, deletedAt: null }); // only the sender, owner inside the query
  if (!message) throw createApiError(404, "Message not found");

  const { conversation } = await loadConversation(me, String(message.conversation));
  if (conversation.lock?.at) throw createApiError(403, "This conversation was closed by Marketplace Support");
  if ((conversation.blockedBy || []).length > 0) throw createApiError(403, "This conversation is closed for replies");
  if (Date.now() - new Date(message.createdAt).getTime() > EDIT_WINDOW_MS) {
    throw createApiError(403, "Messages can only be edited within 15 minutes of sending");
  }

  const body = String(text || "").trim();
  if (message.type === "text" && !body) throw createApiError(400, "A message can't be empty");

  const populated = async () => Message.findById(message._id).populate("sender", PEOPLE_FIELDS).lean();
  if (body === message.text) return { message: toMessageDTO(await populated()) };

  const now = new Date();
  const updated = await Message.findOneAndUpdate(
    { _id: message._id, sender: me._id, deletedAt: null, text: message.text }, // optimistic check: nobody changed it meanwhile
    { $set: { text: body, editedAt: now }, $push: { editHistory: { $each: [{ text: message.text, at: now }], $slice: -10 } } },
    { returnDocument: "after" }
  ).populate("sender", PEOPLE_FIELDS).lean();
  if (!updated) throw createApiError(409, "This message just changed. Please try again.");

  let fresh = conversation;
  if (String(conversation.lastMessage?.messageId) === String(message._id)) {
    fresh = await populateConversation(
      Conversation.findByIdAndUpdate(conversation._id, { $set: { "lastMessage.text": body.slice(0, PREVIEW_LENGTH) } }, { returnDocument: "after" })
    );
  }

  const dto = toMessageDTO(updated);
  emitToBothSides(fresh, "message:edited", (s, viewerId) => ({
    conversationId: String(conversation._id), message: dto, conversation: toConversationDTO(fresh, s, viewerId),
  }));
  return { message: dto };
}

export async function deleteMessage(user, messageId) {
  const me = await requireActiveUser(user.userId);
  assertValidObjectId(messageId, "message id");

  const message = await Message.findOne({ _id: messageId, sender: me._id, deletedAt: null });
  if (!message) throw createApiError(404, "Message not found");

  const { conversation } = await loadConversation(me, String(message.conversation));

  const imagePublicId = message.image?.publicId;
  message.deletedAt = new Date();
  message.image = undefined; // the file goes, the TEXT stays for moderation (see TTL in the Message model)
  await message.save();
  if (imagePublicId) await deleteFromCloudinary(imagePublicId);

  let updated = conversation;
  if (String(conversation.lastMessage?.messageId) === String(message._id)) {
    updated = await populateConversation(
      Conversation.findByIdAndUpdate(conversation._id, { $set: { "lastMessage.deleted": true, "lastMessage.text": "" } }, { returnDocument: "after" })
    );
  }

  emitToBothSides(updated, "message:deleted", (s, viewerId) => ({
    conversationId: String(conversation._id), messageId: String(message._id), conversation: toConversationDTO(updated, s, viewerId),
  }));
  return { deleted: true };
}

export async function deleteConversationForMe(user, conversationId) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);
  if (side === "admin") throw createApiError(400, "Support inbox conversations are shared by all admins and can't be deleted");

  const now = new Date();
  await Conversation.updateOne({ _id: conversation._id }, { $pull: { clears: { user: me._id } } });
  await Conversation.updateOne(
    { _id: conversation._id },
    { $push: { clears: { user: me._id, at: now } }, $addToSet: { hiddenFor: me._id }, $set: { [`unread.${side}`]: 0 } }
  );

  emitToSide(conversation, side, "conversation:removed", { conversationId: String(conversation._id) }); // all my open tabs
  return { deleted: true };
}

export async function createReport(user, conversationId, { category, details }) {
  const me = await requireActiveUser(user.userId);
  const { conversation, side } = await loadConversation(me, conversationId);
  if (conversation.type !== "direct") throw createApiError(400, "Only buyer-seller conversations can be reported");

  const against = idOf(side === "customer" ? conversation.seller : conversation.customer);
  try {
    await ChatReport.create({ conversation: conversation._id, reportedBy: me._id, reporterSide: side, against, category, details });
  } catch (err) {
    if (err?.code === 11000) throw createApiError(409, "You've already reported this conversation. Our team is reviewing it.");
    throw err;
  }
  return { reported: true };
}

// Called when a user's socket connects: everything sent to them while they were offline is now "delivered".
export async function markDeliveredOnConnect({ userId, role }) {
  const filter = role === "customer" ? { type: "direct", customer: userId } : role === "seller" ? { seller: userId } : { type: "support" };
  const conversations = await Conversation.find(filter).select("_id type customer seller").lean();
  if (conversations.length === 0) return;

  const pending = await Message.find({
    conversation: { $in: conversations.map((c) => c._id) }, senderSide: { $ne: role }, deliveredAt: null, deletedAt: null,
  }).select("_id conversation senderSide").limit(5000).lean();
  if (pending.length === 0) return;

  const now = new Date();
  await Message.updateMany({ _id: { $in: pending.map((m) => m._id) } }, { $set: { deliveredAt: now } });

  const byId = new Map(conversations.map((c) => [String(c._id), c]));
  const told = new Set();
  for (const m of pending) {
    const key = `${m.conversation}:${m.senderSide}`;
    if (told.has(key)) continue;
    told.add(key);
    const conversation = byId.get(String(m.conversation));
    if (conversation) emitToSide(conversation, m.senderSide, "messages:delivered", { conversationId: String(m.conversation), at: now });
  }
}

export async function getUnreadCount(user) {
  const me = await requireActiveUser(user.userId);
  const sideKey = me.role === "customer" ? "customer" : me.role === "seller" ? "seller" : "admin";
  const match =
    me.role === "customer" ? { type: "direct", customer: me._id } : me.role === "seller" ? { seller: me._id } : { type: "support" };

  const rows = await Conversation.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$unread.${sideKey}` } } }]);
  return { unread: rows[0]?.total || 0 };
}

export async function deleteUserChatData(userId) {
  const conversations = await Conversation.find({ $or: [{ customer: userId }, { seller: userId }] }).select("_id").lean();
  const ids = conversations.map((c) => c._id);
  const withImages = await Message.find({ conversation: { $in: ids }, "image.publicId": { $exists: true } }).select("image").lean();
  await Promise.all(withImages.map((m) => deleteFromCloudinary(m.image.publicId)));
  await Message.deleteMany({ conversation: { $in: ids } });
  await Conversation.deleteMany({ _id: { $in: ids } });
}