import { Clinic } from '../models/Clinic.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import { geocodeAddress } from '../services/doctor.service.js';

/**
 * @desc List clinics with location search
 * @route GET /api/clinics
 */
export const listClinics = asyncHandler(async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const radius = req.query.radius ? Number(req.query.radius) : 5000;

  const query = {};
  if (lat !== null && lng !== null) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    };
  }

  const clinics = await Clinic.find(query).limit(100);
  return sendResponse(res, 200, "Clinics fetched", { clinics });
});

/**
 * @desc Get clinic by ID
 * @route GET /api/clinics/:id
 */
export const getClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id).populate({
    path: 'doctors',
    populate: [{ path: 'userId', select: 'name email role' }],
  });
  if (!clinic) throw new AppError('Clinic not found', 404);
  return sendResponse(res, 200, "Clinic fetched", { clinic });
});

/**
 * @desc Create clinic
 * @route POST /api/clinics
 */
export const createClinic = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.location || !payload.location.coordinates || (payload.location.coordinates[0] === 0 && payload.location.coordinates[1] === 0)) {
    const addressToGeocode = `${payload.name || ''} ${payload.city || ''}`.trim();
    if (addressToGeocode) {
      const location = await geocodeAddress(addressToGeocode);
      if (location) {
        payload.location = location;
      } else if (payload.city) {
        // Fallback to just city
        const cityLocation = await geocodeAddress(payload.city);
        if (cityLocation) {
          payload.location = cityLocation;
        }
      }
    }
  }
  const clinic = await Clinic.create(payload);
  return sendResponse(res, 201, "Clinic created", { clinic });
});
