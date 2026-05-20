import express from 'express';
import { getSuggestions, globalSearch, geocode } from '../controllers/search.controller.js';

const router = express.Router();

router.get('/suggestions', getSuggestions);
router.get('/global', globalSearch);
router.get('/geocode', geocode);

export default router;
