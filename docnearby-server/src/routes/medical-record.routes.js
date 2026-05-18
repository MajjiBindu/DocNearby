import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as medicalRecordController from '../controllers/medical-record.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole('doctor'),
  medicalRecordController.createRecord
);

router.get(
  '/patient',
  requireRole('patient'),
  medicalRecordController.getPatientRecords
);

router.get(
  '/doctor/patient/:patientId',
  requireRole('doctor'),
  medicalRecordController.getDoctorPatientRecords
);

router.get(
  '/:id',
  medicalRecordController.getRecordDetails
);

export default router;
