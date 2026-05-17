import express from 'express';
import { getSuggestions, globalSearch } from '../controllers/search.controller.js';

const router = express.Router();

router.get('/suggestions', getSuggestions);
router.get('/global', globalSearch);

export default router;
