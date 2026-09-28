import crypto from "crypto";

export function generateVerificationToken(expiresInMs = 60* 1000) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + expiresInMs);
  return { token, tokenHash, expiresAt };
}

// Reused in Phase 5 (verify) and Phase 8/9 (password reset)
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}