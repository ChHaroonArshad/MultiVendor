import { createApiError } from "./apiError.js";

// The "errors" array is the existing error shape ({ field, message }), so the frontend can
// recognise a suspension by its field name and show the reason, without any new response format.
export function assertAccountNotSuspended(user) {
  if (user.status === "suspended") {
    throw createApiError(403, "Your account has been suspended.", [
      { field: "account_suspended", message: user.suspensionReason || "" },
    ]);
  }
}