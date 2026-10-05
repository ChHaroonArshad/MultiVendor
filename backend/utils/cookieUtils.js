function getBaseOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production, plain http allowed on localhost
    sameSite: isProduction ? "none" : "lax", // "none" needed if frontend/backend are on different domains in prod
  };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const base = getBaseOptions();
  res.cookie("accessToken", accessToken, { ...base, path: "/", maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, path: "/api/v1/auth", maxAge: 7 * 24 * 60 * 60 * 1000 });
}

// clearCookie must use the same path/options used when setting, or the browser ignores it
export function clearAuthCookies(res) {
  const base = getBaseOptions();
  res.clearCookie("accessToken", { ...base, path: "/" });
  res.clearCookie("refreshToken", { ...base, path: "/api/v1/auth" });
}


// Must be "lax": Google sends the browser back via a cross-site redirect, and
// "strict" cookies are NOT sent on that return trip, so the state check would always fail.
function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth/google", // only sent to the two Google routes
  };
}

export function setOAuthStateCookie(res, state) {
  res.cookie("oauthState", state, { ...oauthCookieOptions(), maxAge: 10 * 60 * 1000 });
}

export function clearOAuthStateCookie(res) {
  res.clearCookie("oauthState", oauthCookieOptions());
}





export function setPendingSignupCookie(res, token) {
  res.cookie("pendingSignup", token, { ...oauthCookieOptions(), maxAge: 15 * 60 * 1000 });
}

export function clearPendingSignupCookie(res) {
  res.clearCookie("pendingSignup", oauthCookieOptions());
}