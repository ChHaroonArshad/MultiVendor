// backend/src/middleware/roleMiddleware.js

import { createApiError } from "../utils/apiError.js";

// roleMiddleware(["admin"]) or roleMiddleware(["seller", "admin"])
// Must run AFTER authMiddleware, since it depends on req.user being set.
export function roleMiddleware(allowedRoles) {
  return function (req, res, next) {
    // Defensive check: if this ever runs without authMiddleware first,
    // fail closed (deny) instead of crashing or silently allowing.
    if (!req.user || !req.user.role) {
      return next(createApiError(401, "Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createApiError(403, "You do not have permission to perform this action.")
      );
    }

    next();
  };
}