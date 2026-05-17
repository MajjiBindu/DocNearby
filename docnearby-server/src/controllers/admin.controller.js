import * as adminService from '../services/admin.service.js';
import * as userService from '../services/user.service.js';
import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import mongoose from 'mongoose';
import * as emailService from '../services/email.service.js';
import { runReminderJob } from '../jobs/reminderJob.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * @desc Get platform stats
 * @route GET /api/admin/stats
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  return sendResponse(res, 200, "Stats fetched", stats);
});

/**
 * @desc List all users with pagination and search
 * @route GET /api/admin/users
 */
export const listAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query, "-otpHash -password")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit)),
    User.countDocuments(query)
  ]);

  return sendResponse(res, 200, "Users fetched", { 
    users, 
    total, 
    page: Number(page), 
    totalPages: Math.ceil(total / limit) 
  });
});

/**
 * @desc Deactivate a user
 * @route PATCH /api/admin/users/:id/deactivate
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivate(req.params.id);
  return sendResponse(res, 200, "User deactivated", { user });
});

/**
 * @desc Verify a doctor
 * @route PATCH /api/admin/verify/doctor/:id
 */
export const verifyDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.verifyDoctor(req.params.id);
  if (!doctor) throw new AppError('Doctor not found', 404);

  emailService.sendDoctorVerifiedEmail(doctor.userId.email, { 
    doctorName: doctor.userId.name 
  }).catch(err => console.error('Verification email failed', err));

  return sendResponse(res, 200, "Doctor verified", { doctor });
});

/**
 * @desc Reject a doctor
 * @route PATCH /api/admin/doctors/:id/reject
 */
export const rejectDoctor = asyncHandler(async (req, res) => {
  const { reason = "Does not meet verification criteria" } = req.body;
  const doctor = await adminService.rejectDoctor(req.params.id, reason);
  if (!doctor) throw new AppError('Doctor not found', 404);

  emailService.sendDoctorRejectedEmail(doctor.userId.email, { 
    doctorName: doctor.userId.name,
    reason 
  }).catch(err => console.error('Rejection email failed', err));

  return sendResponse(res, 200, "Doctor rejected", { doctor });
});

/**
 * @desc List all appointments
 * @route GET /api/admin/appointments
 */
export const listAllAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const results = await adminService.listAllAppointments(query, { page, limit });
  return sendResponse(res, 200, "Appointments fetched", results);
});
