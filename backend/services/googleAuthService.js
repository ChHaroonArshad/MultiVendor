import { createRemoteJWKSet, jwtVerify } from "jose";
import { User } from "../models/user.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { OAuthTransaction } from "../models/OAuthTransaction.js";
import { PendingGoogleSignup } from "../models/PendingGoogleSignup.js";
import { generateRandomString, generateCodeChallenge } from "../utils/pkceUtils.js";
import { hashToken } from "../utils/tokenUtils.js";
import { createApiError } from "../utils/apiError.js";
import { createSession } from "./authService.js";

const REQUIRED_GOOGLE_ENV = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"];
for (const key of REQUIRED_GOOGLE_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const PENDING_SIGNUP_TTL_MS = 15 * 60 * 1000;
const PENDING_EXPIRED_MESSAGE = "Your Google sign-up session has expired. Please try again.";

export async function createGoogleAuthRequest() {
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

// Returns an existing user (a returning Google user, or a local account we safely link),
// or null when this is a brand-new person who still has to choose a role.
async function findExistingGoogleUser({ googleId, email }) {
  const byGoogleId = await User.findOne({ googleId });
  if (byGoogleId) return assertActive(byGoogleId);

  const byEmail = await User.findOne({ email }).select("+password");
  if (!byEmail) return null;

  assertActive(byEmail);

  // Pre-hijacking guard: if this local account's email was never verified, someone may have
  // registered it with a password they control. Wipe that password and any sessions first.
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

async function createPendingSignup({ googleId, email, name }) {
  await PendingGoogleSignup.deleteMany({ googleId }); // a newer attempt replaces older ones

  const token = generateRandomString();
  await PendingGoogleSignup.create({
    tokenHash: hashToken(token),
    googleId,
    email,
    name: name || "",
    expiresAt: new Date(Date.now() + PENDING_SIGNUP_TTL_MS),
  });
  return token; // raw token goes into the cookie; only its hash is stored
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

  const identity = {
    googleId: payload.sub, // Google's permanent unique ID (emails can change, sub cannot)
    email: payload.email.toLowerCase(),
    name: payload.name,
  };

  const existingUser = await findExistingGoogleUser(identity);
  if (existingUser) {
    const tokens = await createSession(existingUser);
    return { needsRole: false, user: existingUser, ...tokens };
  }

  // Brand-new person: park their identity and let them choose a role first
  const pendingToken = await createPendingSignup(identity);
  return { needsRole: true, pendingToken };
}

// Read-only: lets the role page show "Welcome, name" without consuming the record
export async function getPendingSignup(token) {
  const pending = token ? await PendingGoogleSignup.findOne({ tokenHash: hashToken(token) }) : null;
  if (!pending || pending.expiresAt < new Date()) {
    throw createApiError(400, PENDING_EXPIRED_MESSAGE);
  }
  return { name: pending.name, email: pending.email };
}

export async function finalizeGoogleSignup({ token, role }) {
  // Fetch AND delete in one step: a pending sign-up can only be finished once
  const pending = token
    ? await PendingGoogleSignup.findOneAndDelete({ tokenHash: hashToken(token) })
    : null;
  if (!pending || pending.expiresAt < new Date()) {
    throw createApiError(400, PENDING_EXPIRED_MESSAGE);
  }

  let user;
  try {
    user = await User.create({
      name: (pending.name || pending.email.split("@")[0]).trim().slice(0, 50),
      email: pending.email,
      googleId: pending.googleId,
      role, // already limited to customer/seller by Zod in the route
      isEmailVerified: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw createApiError(409, "An account with this email already exists. Please sign in.");
    }
    throw err;
  }

  const tokens = await createSession(user);
  return { user, ...tokens };
}