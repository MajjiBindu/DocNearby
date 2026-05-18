import { Review } from '../models/Review.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * @desc Create a new review for a doctor
 * @route POST /api/reviews
 */
export const createReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, comment } = req.body;
  const patientId = req.user.userId;

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const existing = await Review.findOne({ patientId, doctorId });
  if (existing) {
    throw new AppError('You have already reviewed this doctor', 409, 'ALREADY_REVIEWED');
  }

  const review = await Review.create({
    patientId,
    doctorId,
    rating,
    comment,
  });

  // Recalculate Doctor rating (Async, don't block response)
  Review.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: '$doctorId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]).then(stats => {
    if (stats.length > 0) {
      Doctor.findByIdAndUpdate(doctorId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      }).exec();
    }
  }).catch(err => console.error('Rating update failed', err));

  return sendResponse(res, 201, "Review created successfully", { review });
});

/**
 * @desc Get all reviews for a specific doctor
 * @route GET /api/reviews/doctor/:doctorId
 */
export const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const reviews = await Review.find({ doctorId })
    .populate('patientId', 'name')
    .sort({ createdAt: -1 });

  // Add defensive null check and filter out missing patient IDs
  const patientIds = reviews
    .map(r => r.patientId?._id)
    .filter(id => id !== undefined && id !== null);

  // Fetch completed appointments for this doctor and these patients
  const completedAppointments = await Appointment.find({
    doctorId,
    patientId: { $in: patientIds },
    status: 'completed',
  });

  const verifiedPatientIds = new Set(
    completedAppointments.map(app => app.patientId.toString())
  );

  const reviewsWithVerified = reviews.map(r => {
    const isVerified = r.patientId
      ? verifiedPatientIds.has(r.patientId._id.toString())
      : false;
    return {
      ...r.toObject(),
      isVerified,
    };
  });

  return sendResponse(res, 200, "Reviews fetched", { reviews: reviewsWithVerified });
});
