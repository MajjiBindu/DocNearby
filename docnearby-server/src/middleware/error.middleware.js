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
  const message = err.message || (status >= 500 ? 'Server error' : 'Request failed')
  console.error('[ERROR] Unhandled API error:', {
    method: req.method,
    url: req.originalUrl,
    status,
    message,
    stack: err.stack,
  })
  return res.status(status).json({
    success: false,
    data: {},
    message,
    error: err.message || String(err),
  })
}
