import jwt from 'jsonwebtoken'
import { env } from '../config/constants.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      data: {},
      message: 'Unauthorized',
      error: 'Missing or invalid Authorization header',
    })
  }

  try {
    const payload = jwt.verify(token, env('JWT_SECRET', ''))
    req.user = payload
    return next()
  } catch (e) {
    return res.status(401).json({
      success: false,
      data: {},
      message: 'Unauthorized',
      error: 'Invalid or expired token',
    })
  }
}

