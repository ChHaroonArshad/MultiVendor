import mongoose from "mongoose";

const pendingGoogleSignupSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes abandoned sign-ups automatically (it checks about once a minute)
pendingGoogleSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingGoogleSignup = mongoose.model("PendingGoogleSignup", pendingGoogleSignupSchema);