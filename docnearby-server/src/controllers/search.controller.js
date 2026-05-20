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

/**
 * @desc Geocode location query via Nominatim
 * @route GET /api/search/geocode
 */
export const geocode = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return sendResponse(res, 400, "Query is required");
  }
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
  const data = await response.json();
  return sendResponse(res, 200, "Geocoding successful", data);
});

