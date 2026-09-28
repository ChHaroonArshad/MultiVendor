import { verifyAccessToken } from "../utils/jwtUtils.js";
import { createApiError } from "../utils/apiError.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    req.cookies?.accessToken ||
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!token) {
    return next(createApiError(401, "Authentication required."));
  }

  try {
    req.user = verifyAccessToken(token); // { userId, role }
    next();
  } catch {
    next(createApiError(401, "Invalid or expired token."));
  }
}