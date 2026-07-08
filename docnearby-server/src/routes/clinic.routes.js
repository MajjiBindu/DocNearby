import { Router } from 'express';
import { createClinic, getClinic, listClinics } from '../controllers/clinic.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', listClinics);
router.get('/:id', getClinic);
router.post('/', requireAuth, requireRole(['admin', 'doctor']), createClinic);

export default router;
