export function notFound(req, res) {
  return res.status(404).json({
    success: false,
    data: {},
    message: 'Not found',
    error: `Route ${req.method} ${req.originalUrl} not found`,
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const message = status >= 500 ? 'Server error' : err.message || 'Request failed'
  return res.status(status).json({
    success: false,
    data: {},
    message,
    error: err.message || String(err),
  })
}

