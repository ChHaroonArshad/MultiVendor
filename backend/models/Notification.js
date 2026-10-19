import mongoose from "mongoose";

// type -> category. The category is DERIVED from the type, so the two can never disagree.
export const NOTIFICATION_TYPES = {
  order_new: "orders",
  order_shipped: "orders",
  order_delivered: "orders",
  order_cancelled: "orders",
  product_approved: "products",
  product_rejected: "products",
  product_submitted: "products",
  seller_registered: "sellers",
  seller_application_submitted: "sellers",
  seller_application_approved: "account",
  seller_application_rejected: "account",
  account_reactivated: "account",
    report_submitted: "reports",
  report_resolved: "reports",
};

export const NOTIFICATION_CATEGORIES = [...new Set(Object.values(NOTIFICATION_TYPES))];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.keys(NOTIFICATION_TYPES), required: true },
    category: { type: String, enum: NOTIFICATION_CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 400 },
    link: { type: String, default: null, maxlength: 300 }, // internal path only, set by the server
    readAt: { type: Date, default: null },                  // null = unread
    dedupeKey: { type: String },                            // idempotency for events that happen once
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // auto-delete after 90 days

export const Notification = mongoose.model("Notification", notificationSchema);