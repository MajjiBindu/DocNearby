import express from 'express'
import {
  getPendingDoctors,
  verifyDoctor,
  listAllAppointments,
  deleteReview,
  getAdminStats,
  getUsers,
  deactivateUser,
  triggerReminders,
  rejectDoctor,
  listAllUsers,
  updateUserRole,
  listAllReviews,
} from '../controllers/admin.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = express.Router()

// All routes here require admin authentication
router.use(requireAuth)
router.use(requireRole(['admin']))

router.get('/stats', (req, res, next) =>
  Promise.resolve(getAdminStats(req, res)).catch(next),
)

router.get('/users', (req, res, next) =>
  Promise.resolve(listAllUsers(req, res)).catch(next),
)

router.patch('/users/:id/role', (req, res, next) =>
  Promise.resolve(updateUserRole(req, res)).catch(next),
)

router.patch('/users/:id/deactivate', (req, res, next) =>
  Promise.resolve(deactivateUser(req, res)).catch(next),
)

router.get('/doctors/pending', (req, res, next) =>
  Promise.resolve(getPendingDoctors(req, res)).catch(next),
)

router.patch('/doctors/:id/verify', (req, res, next) =>
  Promise.resolve(verifyDoctor(req, res)).catch(next),
)

router.patch('/doctors/:id/reject', (req, res, next) =>
  Promise.resolve(rejectDoctor(req, res)).catch(next),
)

router.get('/appointments', (req, res, next) =>
  Promise.resolve(listAllAppointments(req, res)).catch(next),
)

router.get('/reviews', (req, res, next) =>
  Promise.resolve(listAllReviews(req, res)).catch(next),
)

router.delete('/reviews/:id', (req, res, next) =>
  Promise.resolve(deleteReview(req, res)).catch(next),
)

router.post('/reminders/trigger', (req, res, next) =>
  Promise.resolve(triggerReminders(req, res)).catch(next),
)

export default router
