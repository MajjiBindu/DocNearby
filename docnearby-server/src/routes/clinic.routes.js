import { Router } from 'express'
import { createClinic, getClinic, listClinics } from '../controllers/clinic.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/', (req, res, next) => Promise.resolve(listClinics(req, res)).catch(next))
router.get('/:id', (req, res, next) => Promise.resolve(getClinic(req, res)).catch(next))
router.post('/', requireAuth, requireRole('admin'), (req, res, next) =>
  Promise.resolve(createClinic(req, res)).catch(next),
)

export default router

