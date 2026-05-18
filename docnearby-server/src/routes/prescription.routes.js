import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createPrescriptionSchema } from '../validators/prescription.validator.js';
import * as prescriptionController from '../controllers/prescription.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('doctor'),
  validate(createPrescriptionSchema),
  prescriptionController.createPrescription
);

router.get(
  '/my',
  requireRole('patient'),
  prescriptionController.myPrescriptions
);

router.get(
  '/appointment/:appointmentId',
  prescriptionController.getPrescriptionForAppointment
);

export default router;
