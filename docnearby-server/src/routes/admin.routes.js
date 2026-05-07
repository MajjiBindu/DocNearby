import express from 'express'
import {
  listPendingDoctors,
  verifyDoctor,
  listAllAppointments,
  deleteReview,
} from '../controllers/admin.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = express.Router()

// All routes here require admin authentication
router.use(requireAuth)
router.use(requireRole(['admin']))

router.get('/doctors/pending', (req, res, next) =>
  Promise.resolve(listPendingDoctors(req, res)).catch(next),
)

router.patch('/doctors/:id/verify', (req, res, next) =>
  Promise.resolve(verifyDoctor(req, res)).catch(next),
)

router.get('/appointments', (req, res, next) =>
  Promise.resolve(listAllAppointments(req, res)).catch(next),
)

router.delete('/reviews/:id', (req, res, next) =>
  Promise.resolve(deleteReview(req, res)).catch(next),
)

export default router
