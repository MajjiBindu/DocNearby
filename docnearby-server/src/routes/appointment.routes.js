import { Router } from 'express';
import {
  createAppointment,
  doctorAppointments,
  myAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
} from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createAppointmentSchema, updateStatusSchema, rescheduleSchema } from '../validators/appointment.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('patient'), validate(createAppointmentSchema), createAppointment);
router.get('/mine', requireRole('patient'), myAppointments);
router.get('/doctor', requireRole('doctor'), doctorAppointments);
router.patch('/:id/status', requireRole(['patient', 'doctor', 'admin']), validate(updateStatusSchema), updateAppointmentStatus);
router.patch('/:id/reschedule', requireRole(['patient', 'doctor', 'admin']), validate(rescheduleSchema), rescheduleAppointment);

export default router;

