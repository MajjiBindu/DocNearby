import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/common/Spinner.jsx'
import DoctorProfileView from '../components/doctor/DoctorProfile.jsx'
import { doctorApi } from '../services/api.js'

export default function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await doctorApi.get(id)
        if (!cancelled) setDoctor(res?.data?.doctor || null)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load doctor')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const clinic = doctor?.clinicId
  const coords = clinic?.location?.coordinates
  const mapSrc =
    coords?.length === 2
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[0] - 0.01}%2C${coords[1] - 0.01}%2C${coords[0] + 0.01}%2C${coords[1] + 0.01}&layer=mapnik&marker=${coords[1]}%2C${coords[0]}`
      : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner /> Loading doctor…
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <DoctorProfileView doctor={doctor} onBook={() => navigate(`/book/${id}`)} />

      {clinic ? (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Clinic</h2>
          <p className="mt-1 text-sm text-slate-700">{clinic.name}</p>
          <p className="text-sm text-slate-600">
            {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
          </p>
          {mapSrc ? (
            <div className="mt-4 overflow-hidden rounded-lg border">
              <iframe title="map" src={mapSrc} className="h-64 w-full" loading="lazy" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

