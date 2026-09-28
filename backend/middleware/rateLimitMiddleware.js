import rateLimit from "express-rate-limit";
import { createApiError } from "../utils/apiError.js";

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(createApiError(429, "Too many registration attempts. Please try again later."));
  },
});


export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // generous — legitimate clicks, retries, email prefetching by scanners
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many attempts. Please try again later.")),
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // strict — this triggers a real email send, prevent spam/abuse
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(createApiError(429, "Too many resend attempts. Please wait before trying again.")),
});



export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many login attempts. Please try again later.")),
});



export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // strict — this sends a real email, same reasoning as resend-verification
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many requests. Please try again later.")),
});









export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many attempts. Please try again later.")),
});







export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stops someone with a stolen session from brute-forcing the current password
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many attempts. Please try again later.")),
});




export const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(createApiError(429, "Too many sign-in attempts. Please try again later.")),
});