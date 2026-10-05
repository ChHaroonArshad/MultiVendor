import mongoose from "mongoose";

const specSchema = new mongoose.Schema(
  { key: { type: String, required: true, trim: true, maxlength: 50 }, value: { type: String, required: true, trim: true, maxlength: 200 } },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true },
    specs: { type: [specSchema], default: [] },
    images: { type: [imageSchema], default: [] },

    // Admin-controlled: has this product passed review?
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    // Seller-controlled: is it actually visible on the storefront right now?
    // Only meaningful once approvalStatus === "approved" — a pending or
    // rejected product is never shown regardless of this flag.
    isPublished: { type: Boolean, default: false },
    // Set by admin when approvalStatus === "rejected"
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);