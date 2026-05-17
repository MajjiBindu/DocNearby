import { Lab } from '../models/Lab.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * @desc List labs with location search and test filters
 * @route GET /api/labs
 */
export const listLabs = asyncHandler(async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const radius = req.query.radius ? Number(req.query.radius) : 5000;
  const testName = String(req.query.testName || '').trim();

  const testFilter = testName
    ? {
        tests: {
          $elemMatch: { name: { $regex: testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        },
      }
    : {};

  if (lat !== null && lng !== null) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: radius,
          spherical: true,
          query: testFilter,
        },
      },
      {
        $addFields: {
          distanceInKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
        },
      },
      { $project: { distanceMeters: 0 } },
      { $limit: 50 },
    ];

    const labs = await Lab.aggregate(pipeline);
    return sendResponse(res, 200, "Labs fetched", { labs });
  }

  const labs = await Lab.find(testFilter).limit(50);
  return sendResponse(res, 200, "Labs fetched", { labs });
});

/**
 * @desc Get lab by ID
 * @route GET /api/labs/:id
 */
export const getLab = asyncHandler(async (req, res) => {
  const lab = await Lab.findById(req.params.id);
  if (!lab) throw new AppError('Lab not found', 404);
  return sendResponse(res, 200, "Lab fetched", { lab });
});
