import * as doctorService from '../services/doctor.service.js';
import { Appointment } from '../models/Appointment.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import { parseNumber, dayOfWeekShort, minutesFromHHMM, formatAMPM } from '../utils/dateTime.js';

/**
 * @desc List all doctors with filters and location search
 * @route GET /api/doctors
 */
export const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await doctorService.searchDoctors({
    specialty: req.query.specialty,
    language: req.query.language,
    maxFee: parseNumber(req.query.maxFee),
    lat: parseNumber(req.query.lat),
    lng: parseNumber(req.query.lng),
    radius: parseNumber(req.query.radius),
  });

  return sendResponse(res, 200, "Doctors fetched successfully", { doctors });
});

/**
 * @desc Get single doctor by ID
 * @route GET /api/doctors/:id
 */
export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.findById(req.params.id);
  return sendResponse(res, 200, "Doctor fetched successfully", { doctor });
});

/**
 * @desc Get current doctor's profile
 * @route GET /api/doctors/me
 */
export const getMyDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.findByUserId(req.user.userId);
  return sendResponse(res, 200, "Profile fetched successfully", { doctor });
});

/**
 * @desc Update availability slots
 * @route PATCH /api/doctors/:id/availability
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const doctor = await doctorService.update(req.params.id, { availableSlots: req.body.availableSlots }, req.user);
  return sendResponse(res, 200, "Availability updated successfully", { doctor });
});

/**
 * @desc Update doctor profile
 * @route PATCH /api/doctors/:id
 */
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.update(req.params.id, req.body, req.user);
  return sendResponse(res, 200, "Profile updated successfully", { doctor });
});

/**
 * @desc Get available slots for a specific date
 * @route GET /api/doctors/:id/slots
 */
export const getDoctorSlots = asyncHandler(async (req, res) => {
  let dateStr = req.query.date;
  if (!dateStr) throw new AppError("Date is required (YYYY-MM-DD)", 400);

  // Normalize date format (DD-MM-YYYY to YYYY-MM-DD)
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const day = dayOfWeekShort(dateStr);
  const doctor = await doctorService.findById(req.params.id);

  const daySlots = (doctor.availableSlots || []).filter((s) => s.day === day);
  const generated = [];

  for (const s of daySlots) {
    const start = minutesFromHHMM(s.startTime);
    const end = minutesFromHHMM(s.endTime);
    const dur = Number(s.slotDuration || 30);
    if (start === null || end === null) continue;
    for (let t = start; t + dur <= end; t += dur) generated.push(formatAMPM(t));
  }

  const start = new Date(`${dateStr}T00:00:00.000`);
  if (isNaN(start.getTime())) {
    throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400, "invalid_date");
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gte: start, $lt: end },
    status: { $in: ["pending", "confirmed"] },
  }).select("slot");

  const bookedSet = new Set(bookedAppointments.map((a) => a.slot));
  const available = generated.filter((s) => !bookedSet.has(s));

  return sendResponse(res, 200, "Slots fetched successfully", { 
    date: dateStr, 
    day, 
    available, 
    booked: Array.from(bookedSet) 
  });
});
