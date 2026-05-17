import logger from "../utils/logger.js";

export function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: "Resource not found",
    data: {},
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (!statusCode) statusCode = 500;

  const response = {
    success: false,
    message: statusCode >= 500 ? "Internal Server Error" : message,
    data: {},
    error: {
      code:
        err.errorCode || (statusCode >= 500 ? "SERVER_ERROR" : "BAD_REQUEST"),
      message: message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  };

  if (statusCode >= 500) {
    logger.error("[API ERROR] Unhandled exception:", {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn("[API WARN] Client error:", {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      message: err.message,
    });
  }
  console.error(err);
  return res.status(statusCode).json(response);
}
