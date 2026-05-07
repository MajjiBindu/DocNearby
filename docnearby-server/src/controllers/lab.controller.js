import { Lab } from '../models/Lab.js'

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

export async function listLabs(req, res) {
  const lat = parseNumber(req.query.lat)
  const lng = parseNumber(req.query.lng)
  const radius = parseNumber(req.query.radius) ?? 5000
  const testName = String(req.query.testName || '').trim()

  const testFilter = testName
    ? {
        tests: {
          $elemMatch: { name: { $regex: testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        },
      }
    : {}

  // If location provided, use $geoNear to sort by distance and compute distanceInKm.
  if (lat !== null && lng !== null) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: radius,
          spherical: true,
          query: testFilter,
        },
      },
      {
        $addFields: {
          distanceInKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
        },
      },
      {
        $project: {
          distanceMeters: 0,
        },
      },
      { $limit: 100 },
    ]

    const labs = await Lab.aggregate(pipeline)
    return ok(res, { labs }, 'OK')
  }

  // Without location: return matching labs (no distance).
  const labs = await Lab.find(testFilter).limit(100)
  return ok(res, { labs }, 'OK')
}

export async function getLab(req, res) {
  const lab = await Lab.findById(req.params.id)
  if (!lab) return fail(res, 404, 'Lab not found', 'lab_not_found')
  return ok(res, { lab }, 'OK')
}

