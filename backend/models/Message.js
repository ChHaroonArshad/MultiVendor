import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

// A snapshot taken at send time, so a card still makes sense after the product/order changes.
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

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderSide: { type: String, enum: ["customer", "seller", "admin"], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    text: { type: String, default: "", maxlength: 2000 },
    image: { type: imageSchema, default: undefined },
    context: { type: contextSchema, default: undefined },
    clientId: { type: String, default: undefined }, // idempotency key from the sending browser
    readAt: { type: Date, default: null },          // read by the OTHER side
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversation: 1, _id: -1 });
messageSchema.index(
  { conversation: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { clientId: { $type: "string" } } }
);

export const Message = mongoose.model("Message", messageSchema);