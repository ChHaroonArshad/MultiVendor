import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true }); // one row per user per product
wishlistItemSchema.index({ user: 1, createdAt: -1 });

export const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);