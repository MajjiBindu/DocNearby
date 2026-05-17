import { Router } from 'express';
import { createReview, getDoctorReviews } from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createReviewSchema } from '../validators/review.validator.js';

const router = Router();

router.post('/', requireAuth, requireRole(['patient']), validate(createReviewSchema), createReview);
router.get('/doctor/:doctorId', getDoctorReviews);

export default router;
