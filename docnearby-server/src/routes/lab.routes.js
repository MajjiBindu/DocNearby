import { Router } from 'express'
import { getLab, listLabs } from '../controllers/lab.controller.js'

const router = Router()

router.get('/', (req, res, next) => Promise.resolve(listLabs(req, res)).catch(next))
router.get('/:id', (req, res, next) => Promise.resolve(getLab(req, res)).catch(next))

export default router

