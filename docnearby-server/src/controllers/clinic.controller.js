import { Clinic } from '../models/Clinic.js'

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

export async function listClinics(req, res) {
  const lat = parseNumber(req.query.lat)
  const lng = parseNumber(req.query.lng)
  const radius = parseNumber(req.query.radius) ?? 5000

  const query = {}
  if (lat !== null && lng !== null) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    }
  }

  const clinics = await Clinic.find(query).limit(100)
  return ok(res, { clinics }, 'OK')
}

export async function getClinic(req, res) {
  const clinic = await Clinic.findById(req.params.id).populate({
    path: 'doctors',
    populate: [{ path: 'userId', select: 'name phone role' }],
  })
  if (!clinic) return fail(res, 404, 'Clinic not found', 'clinic_not_found')
  return ok(res, { clinic }, 'OK')
}

export async function createClinic(req, res) {
  const payload = req.body || {}
  if (!payload.name) return fail(res, 400, 'Name is required', 'name required')

  const clinic = await Clinic.create({
    name: payload.name,
    address: payload.address || '',
    city: payload.city || '',
    state: payload.state || '',
    pincode: payload.pincode || '',
    phone: payload.phone || '',
    location: payload.location || undefined,
  })

  return ok(res, { clinic }, 'Created')
}

