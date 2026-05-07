import { Router } from 'express'
import { suggestSpecialties } from '../controllers/symptom.controller.js'

const router = Router()

// Route to get specialty suggestions from symptoms
router.post('/suggest', (req, res, next) =>
  Promise.resolve(suggestSpecialties(req, res)).catch(next)
)

export default router
