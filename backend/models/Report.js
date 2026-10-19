import mongoose from "mongoose";
import { REPORT_TARGET_TYPES, REPORT_STATUSES, REPORT_REASONS } from "../utils/reportConstants.js";

const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: "User", default: null }, // null = a guest support request
    contact: {
      name: { type: String, trim: true, maxlength: 80 },
      email: { type: String, trim: true, lowercase: true, maxlength: 255 },
    },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetProduct: { type: ObjectId, ref: "Product", default: null },
    targetSeller: { type: ObjectId, ref: "User", default: null },
    targetLabel: { type: String, trim: true, maxlength: 120, default: "" }, // snapshot, stays readable if the target is deleted
    reason: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return REPORT_REASONS[this.targetType]?.includes(value) ?? false;
        },
        message: "Invalid reason for this report type.",
      },
    },
    details: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: REPORT_STATUSES, default: "open" },

    // Exists only while the report is open/reviewing. The unique index below means one user
    // cannot keep an open report on the same target twice, and closing the report frees the slot.
    activeKey: { type: String },

    reviewedBy: { type: ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    resolution: {
      note: { type: String, trim: true, maxlength: 500 }, // internal, never shown to the reporter
      by: { type: ObjectId, ref: "User" },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: 1 });
reportSchema.index({ targetType: 1, status: 1 });
reportSchema.index({ targetProduct: 1 });
reportSchema.index({ targetSeller: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ activeKey: 1 }, { unique: true, partialFilterExpression: { activeKey: { $type: "string" } } });

export const Report = mongoose.model("Report", reportSchema);