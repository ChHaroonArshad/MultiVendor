import { createApiError } from "../utils/apiError.js";
import { validateMiddleware } from "./validateMiddleware.js";

// Picks the Zod schema from the VERIFIED role in the JWT (req.user.role), never from the body.
export function validateByRoleMiddleware(schemasByRole) {
  return (req, res, next) => {
    const schema = schemasByRole[req.user?.role];
    if (!schema) return next(createApiError(403, "No settings are available for this account type."));
    return validateMiddleware(schema)(req, res, next);
  };
}