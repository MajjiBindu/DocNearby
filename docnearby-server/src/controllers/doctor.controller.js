import { Doctor } from '../models/Doctor.js'
import { Clinic } from '../models/Clinic.js'
import { Appointment } from '../models/Appointment.js'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}
function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

function parseNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function dayOfWeekShort(date) {
  const d = new Date(date)
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return map[d.getDay()]
}

function minutesFromHHMM(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function formatAMPM(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = ((h24 + 11) % 12) + 1
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

function dayRange(dateStr) {
  // Interprets dateStr as local date in server timezone.
  const start = new Date(`${dateStr}T00:00:00.000`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function listDoctors(req, res) {
  const { specialty, language } = req.query
  const maxFee = parseNumber(req.query.maxFee)
  const lat = parseNumber(req.query.lat)
  const lng = parseNumber(req.query.lng)
  const radius = parseNumber(req.query.radius) ?? 5000

  const doctorQuery = {}
  if (specialty) doctorQuery.specialty = specialty
  if (language) doctorQuery.languages = language
  if (maxFee !== null) doctorQuery.consultationFee = { $lte: maxFee }

  if (lat !== null && lng !== null) {
    const clinics = await Clinic.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    }).select('_id')
    const clinicIds = clinics.map((c) => c._id)
    if (!clinicIds.length) return ok(res, { doctors: [] }, 'OK')
    doctorQuery.clinicId = { $in: clinicIds }
  }

  const doctors = await Doctor.find(doctorQuery)
    .populate('userId', 'name phone role')
    .populate('clinicId', 'name address city state pincode location phone')
    .limit(100)

  return ok(res, { doctors }, 'OK')
}

export async function getDoctor(req, res) {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name phone role')
    .populate('clinicId', 'name address city state pincode location phone')
  if (!doctor) return fail(res, 404, 'Doctor not found', 'doctor_not_found')
  return ok(res, { doctor }, 'OK')
}

export async function updateDoctor(req, res) {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) return fail(res, 404, 'Doctor not found', 'doctor_not_found')

  const requester = req.user
  const isOwner = requester?.role === 'doctor' && String(doctor.userId) === String(requester.userId)
  const isAdmin = requester?.role === 'admin'
  if (!isOwner && !isAdmin) return fail(res, 403, 'Forbidden', 'not_owner')

  const allowed = [
    'specialty',
    'qualifications',
    'languages',
    'consultationFee',
    'experience',
    'clinicId',
    'availableSlots',
  ]
  for (const k of allowed) {
    if (req.body?.[k] !== undefined) doctor[k] = req.body[k]
  }
  await doctor.save()

  const updated = await Doctor.findById(doctor._id)
    .populate('userId', 'name phone role')
    .populate('clinicId', 'name address city state pincode location phone')

  return ok(res, { doctor: updated }, 'Updated')
}

export async function getDoctorSlots(req, res) {
  const dateStr = req.query.date
  if (!dateStr) return fail(res, 400, 'Missing date', 'date is required (YYYY-MM-DD)')
  const day = dayOfWeekShort(dateStr)

  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) return fail(res, 404, 'Doctor not found', 'doctor_not_found')

  const daySlots = (doctor.availableSlots || []).filter((s) => s.day === day)
  const generated = []

  for (const s of daySlots) {
    const start = minutesFromHHMM(s.startTime)
    const end = minutesFromHHMM(s.endTime)
    const dur = Number(s.slotDuration || 0)
    if (start === null || end === null || !dur) continue
    for (let t = start; t + dur <= end; t += dur) generated.push(formatAMPM(t))
  }

  const { start, end } = dayRange(dateStr)
  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gte: start, $lt: end },
    status: { $in: ['pending', 'confirmed'] },
  }).select('slot')

  const booked = Array.from(new Set(bookedAppointments.map((a) => a.slot)))
  const bookedSet = new Set(booked)
  const available = generated.filter((s) => !bookedSet.has(s))

  return ok(res, { date: dateStr, day, available, booked }, 'OK')
}

