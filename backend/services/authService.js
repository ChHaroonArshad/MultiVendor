import { User } from "../models/user.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { sendVerificationEmail } from "./emailService.js";
import { createApiError } from "../utils/apiError.js";
import { hashToken, generateVerificationToken } from "../utils/tokenUtils.js";

import { verifyRefreshToken } from "../utils/jwtUtils.js";
import { sendPasswordResetEmail } from "./emailService.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { signAccessToken, signRefreshToken } from "../utils/jwtUtils.js";
import { RefreshToken } from "../models/RefreshToken.js";




export async function registerUser({ name, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw createApiError(409, "An account with this email already exists.");
    }

    const hashedPassword = await hashPassword(password);
    const { token, tokenHash, expiresAt } = generateVerificationToken();

    let user;
    try {
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpires: expiresAt,
        });
    } catch (err) {
        // Race condition guard: two requests could both pass findOne() for the
        // same email before either finishes create(). The unique index is the
        // real protection — this just turns Mongo's raw E11000 into a clean 409.
        if (err.code === 11000) {
            throw createApiError(409, "An account with this email already exists.");
        }
        throw err;
    }

    await sendVerificationEmail(user.email, token);
    return user;
}







export async function verifyEmailToken(token) {
  if (!token) {
    throw createApiError(400, "Verification token is missing.");
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash }).select("+emailVerificationExpires");

  if (!user) {
    throw createApiError(400, "This verification link is invalid or has already been used.");
  }
  if (user.emailVerificationExpires < new Date()) {
    throw createApiError(400, "This verification link has expired. Please request a new one.");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const { accessToken, refreshToken } = await createSession(user);
  return { user, accessToken, refreshToken };
}
export async function resendVerificationEmail(email) {
    const user = await User.findOne({ email });

    // Same "don't reveal account existence" principle as forgot-password.
    // Only actually send if the user exists AND isn't already verified —
    // but the response to the client is identical either way.
    if (user && !user.isEmailVerified) {
        const { token, tokenHash, expiresAt } = generateVerificationToken();
        user.emailVerificationTokenHash = tokenHash;
        user.emailVerificationExpires = expiresAt;
        await user.save();
        await sendVerificationEmail(user.email, token);
    }
}

















export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  // Same error for "no such user" and "wrong password" — don't tell an
  // attacker which part was wrong, that's an account-enumeration leak.
if (!user || !user.password) {
  throw createApiError(401, "Invalid email or password.");
}

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw createApiError(401, "Invalid email or password.");
  }

  if (user.status === "suspended") {
    throw createApiError(403, "Your account has been suspended. Please contact support.");
  }

  if (!user.isEmailVerified) {
    throw createApiError(403, "Please verify your email before logging in.");
  }

  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  user.password = undefined; // strip before returning, belt-and-suspenders on top of toJSON
  return { user, accessToken, refreshToken };
}






export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw createApiError(401, "No refresh token provided.");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw createApiError(401, "Invalid or expired refresh token.");
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.userId });

  // Token is a valid JWT but doesn't exist in DB anymore — means it was
  // already used for rotation, revoked on logout, or manually deleted.
  // Treat this as a real security signal, not just "expired."
  if (!storedToken) {
    throw createApiError(401, "This session is no longer valid. Please log in again.");
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.status === "suspended") {
    throw createApiError(401, "Account not found or suspended.");
  }

  // Rotation: delete the old refresh token, issue a brand new one.
  // This limits how long a stolen refresh token stays useful — if an
  // attacker steals it and uses it, the legitimate user's next refresh
  // attempt will fail (token already rotated away), which is a signal
  // something is wrong, rather than one stolen token working forever.
  await RefreshToken.deleteOne({ _id: storedToken._id });

  const payload = { userId: user._id.toString(), role: user.role };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

  await RefreshToken.create({
    user: user._id,
    tokenHash: newRefreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return; // already logged out, nothing to revoke — not an error

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.deleteOne({ tokenHash }); // no-op if already gone, that's fine
}







export async function forgotPassword(email) {
  const user = await User.findOne({ email });

  // Same enumeration-protection principle as resend-verification:
  // always respond identically whether the account exists or not.
  if (user) {
    const { token, tokenHash, expiresAt } = generateVerificationToken(60 * 60 * 1000); // 1 hour
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();
    await sendPasswordResetEmail(user.email, token);
  }
  // no return value needed — controller sends the same generic message either way
}






export async function resetPassword({ token, password }) {
  const user = await User.findOne({ resetPasswordTokenHash: hashToken(token) }).select(
    "+resetPasswordExpires"
  );

  // Wrong token and already-used token look identical: the hash is cleared after first use
  if (!user) {
    throw createApiError(400, "This reset link is invalid or has already been used.");
  }
  if (user.resetPasswordExpires < new Date()) {
    throw createApiError(400, "This reset link has expired. Please request a new one.");
  }

  user.password = await hashPassword(password);
  user.resetPasswordTokenHash = undefined; // token is now unusable
  user.resetPasswordExpires = undefined;
  await user.save();

  // Security: password changed, so kill every existing session on all devices
  await RefreshToken.deleteMany({ user: user._id });
}







// One place that creates a session (used by change-password now; login/refresh can use it too)
 export async function createSession(user) {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user || user.status === "suspended") {
    throw createApiError(401, "Account not found or suspended.");
  }
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user || user.status === "suspended") {
    throw createApiError(401, "Account not found or suspended.");
  }
if (!user.password) {
  throw createApiError(400, "This account signs in with Google and has no password yet. Use “Forgot password” to create one.");
}
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    // 400, NOT 401: a 401 means "session invalid" and would make the frontend
    // try a token refresh. A wrong current password is just a bad input.
    throw createApiError(400, "Current password is incorrect.");
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  await RefreshToken.deleteMany({ user: user._id }); // sign out every other device
  return createSession(user); // fresh session for this device
}