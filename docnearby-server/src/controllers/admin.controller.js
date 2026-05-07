import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'
import { Review } from '../models/Review.js'
import mongoose from 'mongoose'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}

function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

/**
 * List all doctors awaiting verification
 * GET /api/admin/doctors/pending
 */
export async function listPendingDoctors(req, res) {
  try {
    const doctors = await Doctor.find({ isVerified: false })
      .populate('userId', 'name phone')
      .populate('clinicId', 'name city')

    return ok(res, { doctors })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Verify a doctor
 * PATCH /api/admin/doctors/:id/verify
 */
export async function verifyDoctor(req, res) {
  const { id } = req.params

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true },
    )

    if (!doctor) {
      return fail(res, 404, 'Doctor not found', 'not_found')
    }

    return ok(res, { doctor }, 'Doctor verified successfully')
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * List all appointments with pagination
 * GET /api/admin/appointments
 */
export async function listAllAppointments(req, res) {
  const { status, page = 1, limit = 20 } = req.query
  const skip = (page - 1) * limit

  const query = {}
  if (status) query.status = status

  try {
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name phone')
      .populate('doctorId')
      .populate('clinicId')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))

    const total = await Appointment.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return ok(res, {
      appointments,
      total,
      page: Number(page),
      totalPages,
    })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Delete a review and recalculate doctor stats
 * DELETE /api/admin/reviews/:id
 */
export async function deleteReview(req, res) {
  const { id } = req.params

  try {
    const review = await Review.findByIdAndDelete(id)

    if (!review) {
      return fail(res, 404, 'Review not found', 'not_found')
    }

    const doctorId = review.doctorId

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
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      })
    } else {
      // No reviews left
      await Doctor.findByIdAndUpdate(doctorId, {
        rating: 0,
        reviewCount: 0,
      })
    }

    return ok(res, {}, 'Review deleted and doctor stats updated')
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}
