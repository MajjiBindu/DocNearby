import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import mongoose from 'mongoose'
import * as emailService from '../services/email.service.js'
import { runReminderJob } from '../jobs/reminderJob.js'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}

function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

/**
 * Get platform stats
 * GET /api/admin/stats
 */
export async function getAdminStats(req, res) {
  try {
    const [
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      totalAppointments,
      totalPatients
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ isVerified: true }),
      Doctor.countDocuments({ isVerified: false }),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'patient' })
    ])

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    return ok(res, { 
      totalDoctors, 
      verifiedDoctors,
      pendingDoctors,
      totalAppointments, 
      appointmentsByStatus: appointmentsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count
        return acc
      }, {}),
      totalPatients
    })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * List all users
 * GET /api/admin/users
 */
export async function getUsers(req, res) {
  try {
    const users = await User.find({}, "name email role isVerified isActive createdAt")
      .sort({ createdAt: -1 })

    return ok(res, { users })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Deactivate a user
 * PATCH /api/admin/users/:id/deactivate
 */
export async function deactivateUser(req, res) {
  const { id } = req.params

  try {
    const user = await User.findById(id)
    if (!user) {
      return fail(res, 404, 'User not found', 'not_found')
    }

    user.isActive = false
    await user.save()

    return ok(res, { user }, 'User deactivated successfully')
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
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
 * PATCH /api/admin/verify/doctor/:id (Updated to use PATCH and send notification)
 */
export async function verifyDoctor(req, res) {
  const { id } = req.params

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      id, 
      { isVerified: true, rejectedAt: null, rejectionReason: null }, 
      { new: true }
    ).populate('userId', 'name email')

    if (!doctor) {
      return fail(res, 404, 'Doctor not found', 'not_found')
    }

    // Send notification email fire-and-forget
    emailService.sendDoctorVerifiedEmail(doctor.userId.email, { 
      doctorName: doctor.userId.name 
    }).catch(err => console.error('[ERROR] Failed to send verification email:', err.message))

    return ok(res, { doctor }, 'Doctor verified successfully')
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Reject a doctor
 * PATCH /api/admin/doctors/:id/reject
 */
export async function rejectDoctor(req, res) {
  const { id } = req.params
  const { reason = "Does not meet verification criteria" } = req.body

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { 
        isVerified: false, 
        rejectedAt: new Date(), 
        rejectionReason: reason 
      },
      { new: true }
    ).populate('userId', 'name email')

    if (!doctor) {
      return fail(res, 404, 'Doctor not found', 'not_found')
    }

    // Send notification email fire-and-forget
    emailService.sendDoctorRejectedEmail(doctor.userId.email, { 
      doctorName: doctor.userId.name,
      reason 
    }).catch(err => console.error('[ERROR] Failed to send rejection email:', err.message))

    return ok(res, { doctor }, 'Doctor rejected successfully')
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

/**
 * Manually trigger appointment reminders
 * POST /api/admin/reminders/trigger
 */
export async function triggerReminders(req, res) {
  try {
    const results = await runReminderJob()
    return ok(res, results, 'Reminders triggered successfully')
  } catch (e) {
    return fail(res, 500, 'Failed to trigger reminders', e.message)
  }
}

/**
 * List all users with pagination and search
 * GET /api/admin/users
 */
export async function listAllUsers(req, res) {
  const { role, page = 1, limit = 20, search } = req.query
  const skip = (page - 1) * limit

  const query = {}
  if (role) query.role = role
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  try {
    const users = await User.find(query, "-otpHash -password")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))

    const total = await User.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return ok(res, { users, total, page: Number(page), totalPages })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * Update user role
 * PATCH /api/admin/users/:id/role
 */
export async function updateUserRole(req, res) {
  const { id } = req.params
  const { role } = req.body

  if (!['patient', 'doctor'].includes(role)) {
    return fail(res, 400, 'Invalid role. Only patient or doctor allowed.')
  }

  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-otpHash -password")
    if (!user) return fail(res, 404, 'User not found')

    return ok(res, { user }, `User role updated to ${role}`)
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}

/**
 * List all reviews
 * GET /api/admin/reviews
 */
export async function listAllReviews(req, res) {
  const { page = 1, limit = 20 } = req.query
  const skip = (page - 1) * limit

  try {
    const reviews = await Review.find()
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" }
      })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))

    const total = await Review.countDocuments()
    const totalPages = Math.ceil(total / limit)

    return ok(res, { reviews, total, page: Number(page), totalPages })
  } catch (e) {
    return fail(res, 500, 'Internal Server Error', e.message)
  }
}
