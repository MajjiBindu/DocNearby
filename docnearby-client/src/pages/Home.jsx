import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import Input from '../components/common/Input.jsx'
import { SPECIALTIES } from '../utils/constants.js'
import { useLocation } from '../hooks/useLocation.js'
import { symptomApi } from '../services/api.js'
import translations from '../utils/i18n.js'

export default function Home() {
  const navigate = useNavigate()
  const { city, setCity, coords, useBrowserLocation } = useLocation()

  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en')
  const [symptoms, setSymptoms] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('dn_lang') || 'en')
    }
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  const t = translations[lang]

  const handleSuggest = async () => {
    if (!symptoms.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await symptomApi.suggest(symptoms)
      setSuggestions(res?.data?.specialties || [])
    } catch (e) {
      setError(e?.message || 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{t.tagline}</h1>
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
              {t.useLocation}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-800">{t.popularSpecialties}</p>
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
            {t.searchBtn}
          </Button>
        </div>
      </div>

      {/* Symptom Checker Section */}
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Not sure which doctor?</h2>
        <p className="mt-1 text-sm text-slate-600">Describe your symptoms and we'll suggest a specialist.</p>
        
        <div className="mt-4 space-y-3">
          <textarea
            className="w-full rounded-lg border p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            rows={3}
            placeholder={t.symptomPlaceholder}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSuggest} disabled={loading}>
              {loading ? 'Finding...' : t.findSpecialist}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-800">{t.weSuggest}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

