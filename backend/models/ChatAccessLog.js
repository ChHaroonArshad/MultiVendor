import mongoose from "mongoose";

const chatAccessLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    action: { type: String, enum: ["view", "mediator_message", "lock", "unlock", "resolve_report"], required: true },
    reason: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatAccessLogSchema.index({ conversation: 1, createdAt: -1 });
chatAccessLogSchema.index({ admin: 1, conversation: 1, createdAt: -1 });

export const ChatAccessLog = mongoose.model("ChatAccessLog", chatAccessLogSchema);