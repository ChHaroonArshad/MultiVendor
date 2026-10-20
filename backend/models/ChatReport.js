import mongoose from "mongoose";

const chatReportSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reporterSide: { type: String, enum: ["customer", "seller"], required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: ["harassment", "scam", "spam", "inappropriate", "off_platform", "other"], required: true },
    details: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    resolution: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      note: { type: String, default: "" },
      at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

chatReportSchema.index({ status: 1, createdAt: -1 });
chatReportSchema.index({ conversation: 1, status: 1 });
// one OPEN report per person per conversation: no report spam
chatReportSchema.index(
  { conversation: 1, reportedBy: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

export const ChatReport = mongoose.model("ChatReport", chatReportSchema);