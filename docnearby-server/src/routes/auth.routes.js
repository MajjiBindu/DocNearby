import { Router } from 'express'
import {
  me,
  requestLoginOtp,
  requestSignupOtp,
  resendOtp,
  verifyLoginOtp,
  verifySignupOtp,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/signup/request-otp', (req, res, next) => Promise.resolve(requestSignupOtp(req, res)).catch(next))
router.post('/signup/verify-otp', (req, res, next) => Promise.resolve(verifySignupOtp(req, res)).catch(next))
router.post('/login/request-otp', (req, res, next) => Promise.resolve(requestLoginOtp(req, res)).catch(next))
router.post('/login/verify-otp', (req, res, next) => Promise.resolve(verifyLoginOtp(req, res)).catch(next))
router.post('/resend-otp', (req, res, next) => Promise.resolve(resendOtp(req, res)).catch(next))
router.post('/signup/resend-otp', (req, res, next) => {
  req.body = { ...req.body, purpose: 'signup' }
  return Promise.resolve(resendOtp(req, res)).catch(next)
})
router.post('/login/resend-otp', (req, res, next) => {
  req.body = { ...req.body, purpose: 'login' }
  return Promise.resolve(resendOtp(req, res)).catch(next)
})
router.get('/me', requireAuth, (req, res, next) => Promise.resolve(me(req, res)).catch(next))

export default router
