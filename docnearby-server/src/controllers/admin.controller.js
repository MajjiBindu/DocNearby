import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'
import { Review } from '../models/Review.js'
import mongoose from 'mongoose'
import * as emailService from '../services/email.service.js'

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
export async function getPendingDoctors(req, res) {
  try {
    const doctors = await Doctor.find({ isVerified: false })
      .populate('userId', 'name email')

    return ok(res, { doctors })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Verify a doctor
 * POST /api/admin/verify/doctor/:id
 */
export async function verifyDoctor(req, res) {
  const { id } = req.params
  const { approve } = req.body

  try {
    const doctor = await Doctor.findById(id).populate('userId', 'name email')
    if (!doctor) {
      return fail(res, 404, 'Doctor not found', 'not_found')
    }

    doctor.isVerified = !!approve
    await doctor.save()

    // Send notification email
    const subject = approve 
      ? "Your DocNearby profile is approved" 
      : "DocNearby verification update"
    
    const html = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2>Hello Dr. ${doctor.userId?.name || 'Doctor'},</h2>
        <p>${approve 
          ? "We are pleased to inform you that your profile on DocNearby has been approved. You can now start receiving appointments." 
          : "Thank you for your interest in DocNearby. At this time, we require further information for your profile verification. Please contact our support team."}
        </p>
        <p>Regards,<br>DocNearby Admin Team</p>
      </div>
    `

    await emailService.sendEmail({ to: doctor.userId.email, subject, html })

    return ok(res, { doctor }, approve ? 'Doctor verified successfully' : 'Doctor verification rejected')
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
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email role' }],
      })
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
