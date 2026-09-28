import { asyncHandler } from "../utils/asyncHandler.js";
import { registerUser } from "../services/authService.js";
import { sendSuccessResponse } from "../utils/apiResponse.js";
import { verifyEmailToken, resendVerificationEmail } from "../services/authService.js";
import { refreshAccessToken, logoutUser } from "../services/authService.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookieUtils.js";
import { resetPassword } from "../services/authService.js";
import { forgotPassword } from "../services/authService.js";
import { getCurrentUser, changePassword } from "../services/authService.js";
import { setOAuthStateCookie, clearOAuthStateCookie } from "../utils/cookieUtils.js";
import { createGoogleAuthRequest, completeGoogleLogin } from "../services/googleAuthService.js";
import { loginUser } from "../services/authService.js";
import { env } from "../config/env.js";


export const registerController = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  sendSuccessResponse(res, 201, "Registration successful. Please check your email to verify your account.", { user });
});


export const verifyEmailController = asyncHandler(async (req, res) => {
  await verifyEmailToken(req.query.token);
  sendSuccessResponse(res, 200, "Email verified successfully.");
});

export const resendVerificationController = asyncHandler(async (req, res) => {
  await resendVerificationEmail(req.body.email);
  sendSuccessResponse(
    res,
    200,
    "If an account exists for this email and isn't verified yet, a new link has been sent."
  );
});









const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production", // only over HTTPS in prod; allows http://localhost in dev
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth", // cookie only sent to auth routes, not every request
};


export const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccessResponse(res, 200, "Login successful", { user }); // no tokens in the JSON body anymore
});

export const refreshController = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await refreshAccessToken(req.cookies.refreshToken);
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccessResponse(res, 200, "Session refreshed");
});

export const logoutController = asyncHandler(async (req, res) => {
  await logoutUser(req.cookies.refreshToken);
  clearAuthCookies(res);
  sendSuccessResponse(res, 200, "Logged out successfully");
});



export const forgotPasswordController = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);
  sendSuccessResponse(
    res,
    200,
    "If an account exists for this email, a password reset link has been sent."
  );
});








export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  sendSuccessResponse(res, 200, "Password reset successful. You can now sign in.");
});



export const meController = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId); // from the verified token, never from the request body
  sendSuccessResponse(res, 200, "Current user fetched", { user });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await changePassword(req.user.userId, req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccessResponse(res, 200, "Password changed successfully.");
});



export const googleStartController = asyncHandler(async (req, res) => {
  const { state, url } = await createGoogleAuthRequest();
  setOAuthStateCookie(res, state);
  res.redirect(url);
});


export const googleCallbackController = asyncHandler(async (req, res) => {
  const stateCookie = req.cookies.oauthState;
  clearOAuthStateCookie(res);

  if (req.query.error) {
    return res.redirect(`${env.clientUrl}/login?error=google_cancelled`);
  }

  try {
    const { user, accessToken, refreshToken } = await completeGoogleLogin({
      code: req.query.code,
      state: req.query.state,
      stateCookie,
    });
    setAuthCookies(res, { accessToken, refreshToken });

    const to = user.role === "seller" ? "/dashboard/seller" : "/dashboard";
    res.redirect(`${env.clientUrl}/success?message=${encodeURIComponent("Signed in with Google")}&to=${to}`);
  } catch (err) {
    if (!err.isApiError) console.error(err);
    const code = err.statusCode === 403 ? "google_forbidden" : "google_failed";
    res.redirect(`${env.clientUrl}/login?error=${code}`);
  }
});