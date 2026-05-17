import express from 'express';
import {
  verifyDoctor,
  listAllAppointments,
  getAdminStats,
  deactivateUser,
  rejectDoctor,
  listAllUsers,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/users', listAllUsers);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/doctors/:id/verify', verifyDoctor);
router.patch('/doctors/:id/reject', rejectDoctor);
router.get('/appointments', listAllAppointments);

export default router;
