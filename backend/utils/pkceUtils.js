import crypto from "crypto";

export function generateRandomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url"); // 43 chars, valid PKCE verifier length
}

export function generateCodeChallenge(codeVerifier) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url"); // S256 method
}