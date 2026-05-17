import * as doctorService from '../services/doctor.service.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

/**
 * @desc Unified Global Search
 * @route GET /api/search/global
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const doctors = await doctorService.globalSearch(req.query);
  return sendResponse(res, 200, "Search results fetched", { doctors });
});

/**
 * @desc Autocomplete Suggestions
 * @route GET /api/search/suggestions
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await doctorService.getAutocompleteSuggestions(req.query.q);
  return sendResponse(res, 200, "Suggestions fetched", { suggestions });
});

