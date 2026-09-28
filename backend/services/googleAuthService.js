import { createRemoteJWKSet, jwtVerify } from "jose";
import { User } from "../models/user.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { OAuthTransaction } from "../models/OAuthTransaction.js";
import { generateRandomString, generateCodeChallenge } from "../utils/pkceUtils.js";
import { hashToken } from "../utils/tokenUtils.js";
import { createApiError } from "../utils/apiError.js";
import { createSession } from "./authService.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function createGoogleAuthRequest() {
  console.log("GOOGLE DEBUG:", {
  clientId: process.env.GOOGLE_CLIENT_ID,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});
  const state = generateRandomString();
  const codeVerifier = generateRandomString();
  const nonce = generateRandomString();

  await OAuthTransaction.create({
    stateHash: hashToken(state),
    codeVerifier,
    nonce,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: generateCodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return { state, url: `${GOOGLE_AUTH_URL}?${params}` };
}

function assertActive(user) {
  if (user.status === "suspended") {
    throw createApiError(403, "Your account has been suspended. Please contact support.");
  }
  return user;
}

async function findOrCreateGoogleUser({ googleId, email, name }) {
  // 1. Returning Google user
  const byGoogleId = await User.findOne({ googleId });
  if (byGoogleId) return assertActive(byGoogleId);

  // 2. Existing local account with the same email: link it
  const byEmail = await User.findOne({ email }).select("+password");
  if (byEmail) {
    assertActive(byEmail);

    // Pre-hijacking guard: if the local account's email was never verified, someone
    // may have registered it with a password they control. Wipe that password and
    // any old sessions before linking, so only the real Google owner has access.
    if (!byEmail.isEmailVerified) {
      byEmail.password = undefined;
      byEmail.emailVerificationTokenHash = undefined;
      byEmail.emailVerificationExpires = undefined;
      await RefreshToken.deleteMany({ user: byEmail._id });
    }

    byEmail.googleId = googleId;
    byEmail.isEmailVerified = true; // Google already verified this email
    await byEmail.save();
    return byEmail;
  }

  // 3. Brand-new user. Role is ALWAYS customer here, never chosen by the client.
  try {
    return await User.create({
      name: (name || email.split("@")[0]).trim().slice(0, 50),
      email,
      googleId,
      role: "customer",
      isEmailVerified: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw createApiError(409, "Account already exists. Please try signing in again.");
    }
    throw err;
  }
}

export async function completeGoogleLogin({ code, state, stateCookie }) {
  if (!code || !state || !stateCookie || state !== stateCookie) {
    throw createApiError(400, "Invalid Google sign-in response.");
  }

  // Fetch AND delete in one step: each flow can only ever be used once
  const transaction = await OAuthTransaction.findOneAndDelete({ stateHash: hashToken(state) });
  if (!transaction || transaction.expiresAt < new Date()) {
    throw createApiError(400, "Google sign-in expired. Please try again.");
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: transaction.codeVerifier, // PKCE proof
    }),
  });
  if (!tokenRes.ok) throw createApiError(401, "Google sign-in failed.");

  const { id_token: idToken } = await tokenRes.json();
  if (!idToken) throw createApiError(401, "Google sign-in failed.");

  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID,
    }));
  } catch {
    throw createApiError(401, "Google sign-in failed.");
  }

  if (payload.nonce !== transaction.nonce) throw createApiError(401, "Google sign-in failed.");
  if (!payload.email || payload.email_verified !== true) {
    throw createApiError(403, "Your Google email address is not verified.");
  }

  const user = await findOrCreateGoogleUser({
    googleId: payload.sub, // Google's permanent unique ID (emails can change, sub cannot)
    email: payload.email.toLowerCase(),
    name: payload.name,
  });

  const tokens = await createSession(user);
  return { user, ...tokens };
}