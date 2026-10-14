import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
   password: { type: String, required: function () { return !this.googleId; }, select: false },
googleId: { type: String, unique: true, sparse: true }, 
    role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
    isEmailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    resetPasswordTokenHash: { type: String, select: false },
resetPasswordExpires: { type: Date, select: false },
suspensionReason: { type: String, default: null },
suspendedAt: { type: Date, default: null },

// ....................
phone: { type: String, default: null },
dateOfBirth: { type: Date, default: null },
// null must be listed in the enum, otherwise clearing the value fails validation
gender: { type: String, enum: ["female", "male", "other", null], default: null },

avatar: { type: String, default: null },                          // public url, safe to expose
avatarPublicId: { type: String, default: null, select: false },   // Cloudinary id, server only

preferences: {
  // customer
  orderNotifications: { type: Boolean, default: true },
  promoEmails: { type: Boolean, default: false },
  reviewReminders: { type: Boolean, default: true },
  recommendations: { type: Boolean, default: true },
  language: { type: String, enum: ["en", "ur", "es"], default: "en" },
  currency: { type: String, enum: ["usd", "eur", "gbp"], default: "usd" },
  // seller
  orders: { type: Boolean, default: true },
  products: { type: Boolean, default: true },
  system: { type: Boolean, default: false },
  // admin
  newSellerApplications: { type: Boolean, default: true },
  newProductSubmissions: { type: Boolean, default: true },
  weeklySummary: { type: Boolean, default: true },
},

  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.__v;
    delete ret.avatarPublicId;
    return ret;
  },
});















export const User = mongoose.models.User || mongoose.model("User", userSchema);


