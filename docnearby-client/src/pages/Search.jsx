import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilters from '../components/doctor/DoctorFilters.jsx'
import DoctorCard from '../components/doctor/DoctorCard.jsx'
import Spinner from '../components/common/Spinner.jsx'
import { useLocation } from '../hooks/useLocation.js'
import { useDoctors } from '../hooks/useDoctors.js'

export default function Search() {
  const { coords } = useLocation()
  const [sp] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    specialty: sp.get('specialty') || '',
    language: '',
    maxFee: '',
  }))

  const params = useMemo(() => {
    const p = {}
    if (coords?.lat && coords?.lng) Object.assign(p, { lat: coords.lat, lng: coords.lng, radius: 5000 })
    if (filters.specialty) p.specialty = filters.specialty
    if (filters.language) p.language = filters.language
    if (filters.maxFee) p.maxFee = Number(filters.maxFee)
    return p
  }, [coords, filters])

  const { loading, error, doctors } = useDoctors(params)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border bg-white p-4 h-fit">
          <p className="mb-3 text-sm font-semibold text-slate-900">Filters</p>
          <DoctorFilters filters={filters} setFilters={setFilters} />
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Doctors</h2>
            {loading ? <Spinner /> : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorCard key={d._id} doctor={d} />
            ))}
          </div>

          {!loading && !doctors.length ? (
            <p className="mt-6 text-sm text-slate-600">No doctors found. Try widening filters.</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

