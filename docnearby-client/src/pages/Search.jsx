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
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 h-fit shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Filters</h2>
          <DoctorFilters filters={filters} setFilters={setFilters} />
        </aside>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Available Doctors</h1>
            {loading && doctors.length > 0 && <Spinner className="h-5 w-5 text-indigo-600" />}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && doctors.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in duration-500">
              <Spinner className="h-10 w-10 text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Searching for specialists near you...</p>
            </div>
          ) : !loading && doctors.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center p-8 animate-in fade-in duration-500">
              <div className="rounded-full bg-slate-100 p-4">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No doctors found</h3>
                <p className="mt-1 text-sm text-slate-500">Try widening your search radius or adjusting your filters.</p>
              </div>
              <button 
                onClick={() => setFilters({ specialty: '', language: '', maxFee: '' })}
                className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {doctors.map((d) => (
                <DoctorCard key={d._id} doctor={d} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

