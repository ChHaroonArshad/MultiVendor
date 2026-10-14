
import mongoose from "mongoose";

const sellerProfileSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    category: { type: String, trim: true, maxlength: 50, default: "" },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 255, default: "" }, // shown publicly
    phone: { type: String, trim: true, maxlength: 20, default: "" },                          // private
    logo: { type: String, default: null },
    logoPublicId: { type: String, default: null, select: false },
    banner: { type: String, default: null },
    bannerPublicId: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

sellerProfileSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.logoPublicId;
    delete ret.bannerPublicId;
    delete ret.__v;
    return ret;
  },
});

export const SellerProfile = mongoose.model("SellerProfile", sellerProfileSchema);