/**
 * Standard API response utility
 */
export const sendResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null
  });
};

export const sendError = (res, statusCode, message, errorCode = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: {},
    error: {
      code: errorCode,
      message: message
    }
  });
};
