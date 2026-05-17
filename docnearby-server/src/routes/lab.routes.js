import { Router } from 'express';
import { getLab, listLabs } from '../controllers/lab.controller.js';

const router = Router();

router.get('/', listLabs);
router.get('/:id', getLab);

export default router;
