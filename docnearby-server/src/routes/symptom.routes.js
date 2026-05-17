import { Router } from 'express';
import { suggestSpecialties } from '../controllers/symptom.controller.js';

const router = Router();

router.post('/suggest', suggestSpecialties);

export default router;
