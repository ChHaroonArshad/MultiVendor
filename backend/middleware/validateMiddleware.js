import { createApiError } from "../utils/apiError.js";

export function validateMiddleware(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(createApiError(400, "Validation failed", errors));
    }

    req.body = result.data; // trimmed/lowercased values from Zod replace raw input
    next();
  };
}