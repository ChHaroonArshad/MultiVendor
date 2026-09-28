

export function errorMiddleware(err, req, res, next) {
  if (err.isApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: [],
  });

}

// export function errorMiddleware(err, req, res, next) {
//   const statusCode = err.statusCode || 500;
//   const message = err.isApiError ? err.message : "Something went wrong. Please try again.";
//   const errors = err.errors || [];

//   if (!err.isApiError) {
//     // Unexpected errors: log full detail server-side, never leak to client
//     console.error(err);
//   }

//   res.status(statusCode).json({ success: false, message, errors });
// }