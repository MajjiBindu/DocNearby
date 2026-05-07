import { Router } from 'express'
import { createReview, getDoctorReviews } from '../controllers/review.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = Router()

// Create a review (Patient only)
router.post('/', requireAuth, requireRole(['patient']), (req, res, next) =>
  Promise.resolve(createReview(req, res)).catch(next)
)

// Get reviews for a doctor (Public)
router.get('/doctor/:doctorId', (req, res, next) =>
  Promise.resolve(getDoctorReviews(req, res)).catch(next)
)

export default router
