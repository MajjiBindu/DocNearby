import { Router } from 'express'
import { me, sendOtp, verifyOtp } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/send-otp', (req, res, next) => Promise.resolve(sendOtp(req, res)).catch(next))
router.post('/verify-otp', (req, res, next) => Promise.resolve(verifyOtp(req, res)).catch(next))
router.get('/me', requireAuth, (req, res, next) => Promise.resolve(me(req, res)).catch(next))

export default router

