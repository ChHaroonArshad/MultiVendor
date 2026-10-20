import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

const contextSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["product", "order"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const editSchema = new mongoose.Schema(
  { text: { type: String, default: "" }, at: { type: Date, required: true } },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderSide: { type: String, enum: ["customer", "seller", "admin"], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    text: { type: String, default: "", maxlength: 2000 },
    image: { type: imageSchema, default: undefined },
    context: { type: contextSchema, default: undefined },
    clientId: { type: String, default: undefined },
    deliveredAt: { type: Date, default: null }, // the other side's device received it
    readAt: { type: Date, default: null },      // the other side opened it
    editedAt: { type: Date, default: null },
    editHistory: { type: [editSchema], default: [] }, // previous versions, kept so edits can't hide evidence
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversation: 1, _id: -1 });
messageSchema.index(
  { conversation: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { clientId: { $type: "string" } } }
);
// A deleted message keeps its TEXT for 30 days so moderators can still see evidence, then it is removed.
messageSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const Message = mongoose.model("Message", messageSchema);