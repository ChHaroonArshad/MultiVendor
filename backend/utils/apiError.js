export function createApiError(statusCode, message, errors = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  error.errors = errors;
  error.isApiError = true;
  return error;
}