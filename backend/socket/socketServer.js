import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { getSide, otherSideOf, idOf } from "../utils/chatSides.js";

let io = null;
const onlineCounts = new Map(); // userId -> number of open sockets

function parseCookies(header = "") {
  return header.split(";").reduce((acc, part) => {
    const index = part.indexOf("=");
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    if (key) acc[key] = decodeURIComponent(part.slice(index + 1).trim());
    return acc;
  }, {});
}

export function isUserOnline(userId) {
  return (onlineCounts.get(String(userId)) || 0) > 0;
}

// "Delivered" means the other side has at least one connected device right now.
export function isSideOnline(conversation, side) {
  if (!io) return false;
  if (side === "admin") return (io.sockets.adapter.rooms.get("admins")?.size || 0) > 0;
  return isUserOnline(idOf(conversation[side]));
}

export function emitToSide(conversation, side, event, payload) {
  if (!io) return;
  if (side === "admin") io.to("admins").emit(event, payload);
  else io.to(`user:${idOf(conversation[side])}`).emit(event, payload);
}

export function disconnectUserSockets(userId) {
  io?.in(`user:${userId}`).disconnectSockets(true);
}

async function broadcastPresence(userId, online) {
  try {
    const conversations = await Conversation.find({
      type: "direct",
      $or: [{ customer: userId }, { seller: userId }],
    }).select("customer seller").lean();

    const partners = new Set(
      conversations.map((c) => (idOf(c.customer) === String(userId) ? idOf(c.seller) : idOf(c.customer)))
    );
    partners.forEach((partnerId) => io.to(`user:${partnerId}`).emit("presence:update", { userId: String(userId), online }));
  } catch (err) {
    console.error("Presence broadcast failed:", err.message);
  }
}

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.clientUrl, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const token = parseCookies(socket.handshake.headers.cookie).accessToken;
      if (!token) return next(new Error("unauthorized"));

      const payload = jwt.verify(token, env.jwtAccessSecret);
      const user = await User.findOne({ _id: payload.userId, status: "active" }).select("name role").lean();
      if (!user) return next(new Error("unauthorized"));

      socket.data.user = { userId: String(user._id), role: user.role, name: user.name };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, name } = socket.data.user;

    socket.join(`user:${userId}`);
    if (role === "admin") socket.join("admins");

    const count = (onlineCounts.get(userId) || 0) + 1;
    onlineCounts.set(userId, count);
    if (count === 1) broadcastPresence(userId, true);

    // Messages sent while this user was offline become "delivered" now (dynamic import avoids a circular import).
    import("../services/chatService.js")
      .then(({ markDeliveredOnConnect }) => markDeliveredOnConnect({ userId, role }))
      .catch((err) => console.error("Delivery sync failed:", err.message));

    socket.on("typing", async (payload) => {
      try {
        const { conversationId, isTyping } = payload || {};
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

        const now = Date.now();
        if (isTyping && now - (socket.data.lastTypingAt || 0) < 700) return;
        socket.data.lastTypingAt = now;

        const conversation = await Conversation.findById(conversationId).select("type customer seller").lean();
        if (!conversation) return;
        const side = getSide(conversation, { userId, role });
        if (!side) return;

        emitToSide(conversation, otherSideOf(conversation, side), "typing", {
          conversationId: String(conversationId),
          side,
          name,
          isTyping: Boolean(isTyping),
        });
      } catch {
        // typing is cosmetic
      }
    });

    socket.on("disconnect", () => {
      const left = (onlineCounts.get(userId) || 1) - 1;
      if (left <= 0) {
        onlineCounts.delete(userId);
        broadcastPresence(userId, false);
      } else {
        onlineCounts.set(userId, left);
      }
    });
  });

  return io;
}