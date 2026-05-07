import jwt from 'jsonwebtoken'
import { env, ROLES } from '../config/constants.js'
import { sendOtp as sendOtpSvc, verifyOtp as verifyOtpSvc } from '../services/otp.service.js'
import { User } from '../models/User.js'
import { Doctor } from '../models/Doctor.js'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}
function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10)
}

export async function sendOtp(req, res) {
  const phone = normalizePhone(req.body?.phone)
  const role = req.body?.role

  if (!phone || phone.length !== 10) return fail(res, 400, 'Invalid phone', 'Phone must be 10 digits')
  if (role && !ROLES.includes(role)) return fail(res, 400, 'Invalid role', 'Role must be patient/doctor/admin')

  const result = await sendOtpSvc(phone)
  return ok(res, { phone, expiresAt: result.expiresAt }, 'OTP sent (mock)')
}

export async function verifyOtp(req, res) {
  const phone = normalizePhone(req.body?.phone)
  const otp = String(req.body?.otp || '').trim()
  const role = req.body?.role || 'patient'
  const name = String(req.body?.name || '').trim()

  if (!phone || phone.length !== 10) return fail(res, 400, 'Invalid phone', 'Phone must be 10 digits')
  if (!otp || otp.length !== 6) return fail(res, 400, 'Invalid OTP', 'OTP must be 6 digits')
  if (!ROLES.includes(role)) return fail(res, 400, 'Invalid role', 'Role must be patient/doctor/admin')

  const verdict = verifyOtpSvc(phone, otp)
  if (!verdict.ok) {
    const msg =
      verdict.reason === 'expired'
        ? 'OTP expired'
        : verdict.reason === 'max_attempts'
          ? 'Max attempts reached'
          : 'Invalid OTP'
    return fail(res, 401, msg, verdict.reason)
  }

  let user = await User.findOne({ phone })
  if (!user) {
    user = await User.create({ phone, role, name })
  } else if (role && user.role !== role && user.role !== 'admin') {
    // allow upgrading patient->doctor for local testing; keep admin intact
    user.role = role
    if (name) user.name = name
    await user.save()
  } else if (name && !user.name) {
    user.name = name
    await user.save()
  }

  if (user.role === 'doctor') {
    const existingDoctor = await Doctor.findOne({ userId: user._id })
    if (!existingDoctor) await Doctor.create({ userId: user._id })
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, phone: user.phone },
    env('JWT_SECRET', ''),
    { expiresIn: env('JWT_EXPIRY', '7d') },
  )

  return ok(res, { token, user }, 'OTP verified')
}

export async function me(req, res) {
  const userId = req.user?.userId
  const user = await User.findById(userId)
  if (!user) return fail(res, 404, 'User not found', 'user_not_found')
  return ok(res, { user }, 'OK')
}

