import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import Input from '../components/common/Input.jsx'
import { SPECIALTIES } from '../utils/constants.js'
import { useLocation } from '../hooks/useLocation.js'

export default function Home() {
  const navigate = useNavigate()
  const { city, setCity, coords, useBrowserLocation } = useLocation()
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Find doctors near you</h1>
        <p className="mt-2 text-slate-600">
          Book appointments with independent doctors and smaller clinics in your city.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            label="Your city"
            placeholder="e.g. Warangal, Hubballi, Ujjain"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={async () => {
                try {
                  await useBrowserLocation()
                } catch {
                  // ignore: UI will still allow city-based search
                }
              }}
            >
              Use my location
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-800">Popular specialties</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {coords ? `Using GPS: ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : 'Tip: GPS gives best nearby results.'}
          </p>
          <Button type="button" onClick={() => navigate('/search')}>
            Search doctors
          </Button>
        </div>
      </div>
    </div>
  )
}

