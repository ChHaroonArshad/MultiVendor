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

const conversationSchema = new mongoose.Schema(
  {
    // "direct:<customerId>:<sellerId>" or "support:<sellerId>". The unique key makes get-or-create race-safe.
    key: { type: String, required: true, unique: true },
    type: { type: String, enum: ["direct", "support"], required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: lastMessageSchema, default: null },
    lastMessageAt: { type: Date, default: null },
    // unread counters per "side". In a support chat the admin side is shared by every admin.
    unread: {
      customer: { type: Number, default: 0 },
      seller: { type: Number, default: 0 },
      admin: { type: Number, default: 0 },
    },
    blockedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ customer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);