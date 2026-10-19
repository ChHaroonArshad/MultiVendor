import { verifyAccessToken } from "../utils/jwtUtils.js";

// For routes open to guests AND members: attaches req.user when a valid token exists,
// and silently carries on as a guest otherwise. It never blocks the request.
export function optionalAuthMiddleware(req, res, next) {
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // expired or invalid token: treat as a guest
    }
  }
  next();
}