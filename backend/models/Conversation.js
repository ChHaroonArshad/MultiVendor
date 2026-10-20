import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ["text", "image"], default: "text" },
    text: { type: String, default: "" },
    senderSide: { type: String, enum: ["customer", "seller", "admin"] },
    deleted: { type: Boolean, default: false },
    at: { type: Date },
  },
  { _id: false }
);

const clearSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    type: { type: String, enum: ["direct", "support"], required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: lastMessageSchema, default: null },
    lastMessageAt: { type: Date, default: null },
    unread: {
      customer: { type: Number, default: 0 },
      seller: { type: Number, default: 0 },
      admin: { type: Number, default: 0 },
    },
    blockedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    // Set by an admin moderator. While locked neither party can send (admins still can).
    lock: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reason: { type: String, default: "" },
      at: { type: Date, default: null },
    },
    // "Delete conversation" is per user: hiddenFor hides it from that user's list, clears remembers
    // from when their history starts again.
    hiddenFor: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    clears: { type: [clearSchema], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ customer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);