import { Router } from 'express'
import {
  createAppointment,
  doctorAppointments,
  myAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = Router()

router.post('/', requireAuth, requireRole('patient'), (req, res, next) =>
  Promise.resolve(createAppointment(req, res)).catch(next),
)
router.get('/mine', requireAuth, requireRole('patient'), (req, res, next) =>
  Promise.resolve(myAppointments(req, res)).catch(next),
)
router.get('/doctor', requireAuth, requireRole('doctor'), (req, res, next) =>
  Promise.resolve(doctorAppointments(req, res)).catch(next),
)
router.patch('/:id/status', requireAuth, requireRole(['patient', 'doctor', 'admin']), (req, res, next) =>
  Promise.resolve(updateAppointmentStatus(req, res)).catch(next),
)

export default router

