import mongoose from "mongoose";

const oauthTransactionSchema = new mongoose.Schema({
  stateHash: { type: String, required: true, unique: true },
  codeVerifier: { type: String, required: true },
  nonce: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB auto-deletes abandoned flows, so no cleanup job is needed
oauthTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthTransaction = mongoose.model("OAuthTransaction", oauthTransactionSchema);