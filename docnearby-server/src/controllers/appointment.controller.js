import { Appointment } from '../models/Appointment.js'
import { Doctor } from '../models/Doctor.js'
import { APPOINTMENT_STATUSES } from '../config/constants.js'

function ok(res, data = {}, message = '') {
  return res.json({ success: true, data, message, error: '' })
}
function fail(res, status, message, error = '') {
  return res.status(status).json({ success: false, data: {}, message, error })
}

export async function createAppointment(req, res) {
  const patientId = req.user?.userId
  const { doctorId, date, slot } = req.body || {}

  if (!doctorId) return fail(res, 400, 'doctorId is required', 'doctorId required')
  if (!date) return fail(res, 400, 'date is required', 'date required')
  if (!slot) return fail(res, 400, 'slot is required', 'slot required')

  const start = new Date(`${date}T00:00:00.000`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const doctor = await Doctor.findById(doctorId)
  if (!doctor) return fail(res, 404, 'Doctor not found', 'doctor_not_found')
  if (!doctor.clinicId) return fail(res, 400, 'Doctor has no clinic', 'clinicId missing on doctor')

  const existing = await Appointment.findOne({
    doctorId: doctor._id,
    slot,
    date: { $gte: start, $lt: end },
    status: { $ne: 'cancelled' },
  }).select('_id status')

  if (existing) {
    return res.status(409).json({
      success: false,
      data: {},
      message: 'Slot already taken',
      error: 'slot_taken',
    })
  }

  const appt = await Appointment.create({
    patientId,
    doctorId: doctor._id,
    clinicId: doctor.clinicId,
    date: start,
    slot,
    status: 'pending',
    smsConfirmationSent: false,
  })

  const populated = await Appointment.findById(appt._id)
    .populate({
      path: 'doctorId',
      populate: [{ path: 'userId', select: 'name phone role' }, { path: 'clinicId' }],
    })
    .populate('clinicId')

  return ok(res, { appointment: populated }, 'Created')
}

export async function myAppointments(req, res) {
  const patientId = req.user?.userId
  const appointments = await Appointment.find({ patientId })
    .sort({ date: -1, createdAt: -1 })
    .populate({
      path: 'doctorId',
      populate: [{ path: 'userId', select: 'name phone role' }, { path: 'clinicId' }],
    })
    .populate('clinicId')

  return ok(res, { appointments }, 'OK')
}

export async function doctorAppointments(req, res) {
  const userId = req.user?.userId
  const doctor = await Doctor.findOne({ userId })
  if (!doctor) return fail(res, 404, 'Doctor profile not found', 'doctor_profile_not_found')

  const appointments = await Appointment.find({ doctorId: doctor._id })
    .sort({ date: -1, createdAt: -1 })
    .populate('patientId', 'name phone role')
    .populate('clinicId')
    .populate({
      path: 'doctorId',
      populate: [{ path: 'userId', select: 'name phone role' }],
    })

  return ok(res, { appointments }, 'OK')
}

export async function updateAppointmentStatus(req, res) {
  const { status } = req.body || {}
  if (!APPOINTMENT_STATUSES.includes(status))
    return fail(res, 400, 'Invalid status', 'status must be pending/confirmed/cancelled/completed')

  const appt = await Appointment.findById(req.params.id)
  if (!appt) return fail(res, 404, 'Appointment not found', 'appointment_not_found')

  const role = req.user?.role
  const userId = req.user?.userId

  if (role === 'patient') {
    if (String(appt.patientId) !== String(userId)) return fail(res, 403, 'Forbidden', 'not_owner')
    if (status !== 'cancelled') return fail(res, 400, 'Patients can only cancel', 'invalid_transition')
  }

  if (role === 'doctor') {
    const doctor = await Doctor.findOne({ userId })
    if (!doctor || String(doctor._id) !== String(appt.doctorId))
      return fail(res, 403, 'Forbidden', 'not_owner')
  }

  appt.status = status
  await appt.save()

  const updated = await Appointment.findById(appt._id)
    .populate('patientId', 'name phone role')
    .populate('clinicId')
    .populate({
      path: 'doctorId',
      populate: [{ path: 'userId', select: 'name phone role' }, { path: 'clinicId' }],
    })

  return ok(res, { appointment: updated }, 'Updated')
}

