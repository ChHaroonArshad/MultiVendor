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

  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.__v;
    return ret;
  },
});
export const User = mongoose.models.User || mongoose.model("User", userSchema);
