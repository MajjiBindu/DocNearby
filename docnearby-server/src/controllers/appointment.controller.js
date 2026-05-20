import * as appointmentService from '../services/appointment.service.js';
import { Doctor } from '../models/Doctor.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * @desc Create a new appointment
 * @route POST /api/appointments
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.create(req.user, req.body);
  return sendResponse(res, 201, "Appointment created successfully", { appointment });
});

/**
 * @desc Get current patient's appointments
 * @route GET /api/appointments/my
 */
export const myAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.findByPatient(req.user.userId);
  return sendResponse(res, 200, "Appointments fetched successfully", { appointments });
});

/**
 * @desc Get doctor's appointments
 * @route GET /api/appointments/doctor
 */
export const doctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.userId });
  if (!doctor) throw new AppError("Doctor profile not found", 404);

  const appointments = await appointmentService.findByDoctor(doctor._id);
  return sendResponse(res, 200, "Doctor appointments fetched successfully", { appointments });
});

/**
 * @desc Update appointment status
 * @route PATCH /api/appointments/:id/status
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateStatus(req.params.id, req.body.status, req.user);
  return sendResponse(res, 200, "Appointment status updated", { appointment });
});

/**
 * @desc Reschedule an appointment
 * @route PATCH /api/appointments/:id/reschedule
 */
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { date, slot } = req.body;
  const appointment = await appointmentService.reschedule(req.params.id, date, slot, req.user);
  return sendResponse(res, 200, "Appointment rescheduled successfully", { appointment });
});

