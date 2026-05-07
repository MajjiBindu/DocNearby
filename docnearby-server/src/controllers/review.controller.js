import { Review } from '../models/Review.js'
import { Doctor } from '../models/Doctor.js'
import mongoose from 'mongoose'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}

function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

/**
 * Create a new review for a doctor
 * POST /api/reviews
 * Only patients can review
 */
export async function createReview(req, res) {
  const { doctorId, rating, comment } = req.body
  const patientId = req.user.userId

  if (!doctorId || !rating) {
    return fail(res, 400, 'Missing doctorId or rating', 'bad_request')
  }

  if (rating < 1 || rating > 5) {
    return fail(res, 400, 'Rating must be between 1 and 5', 'invalid_rating')
  }

  // Prevent duplicate reviews
  const existing = await Review.findOne({ patientId, doctorId })
  if (existing) {
    return fail(res, 409, 'You have already reviewed this doctor', 'conflict')
  }

  const review = await Review.create({
    patientId,
    doctorId,
    rating,
    comment,
  })

  // Recalculate Doctor rating and reviewCount using aggregation pipeline
  const stats = await Review.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: '$doctorId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ])

  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal place
      reviewCount: stats[0].reviewCount,
    })
  }

  return ok(res, { review }, 'Review created successfully')
}

/**
 * Get all reviews for a specific doctor
 * GET /api/reviews/doctor/:doctorId
 * Public access
 */
export async function getDoctorReviews(req, res) {
  const { doctorId } = req.params

  const reviews = await Review.find({ doctorId })
    .populate('patientId', 'name')
    .sort({ createdAt: -1 })

  return ok(res, { reviews }, 'OK')
}
