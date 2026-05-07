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
    if (!symptoms.trim()) {
      setError('Please describe your symptoms first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await symptomApi.suggest(symptoms)
      setSuggestions(res?.data?.specialties || [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="mx-auto max-w-6xl px-4 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t.tagline}</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-500 leading-relaxed">
              Book appointments with independent doctors and smaller clinics in your city. Experience healthcare without the middleman.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
              <Input
                label="Your city"
                placeholder="e.g. Warangal, Hubballi, Ujjain"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-2xl"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-[42px] rounded-2xl border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                  onClick={async () => {
                    try {
                      await useBrowserLocation()
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t.useLocation}
                  </div>
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.popularSpecialties}</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 active:scale-95"
                    onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
              <p className="text-xs font-medium text-slate-400">
                {coords ? (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    GPS Active: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
                  </span>
                ) : 'Tip: GPS gives best nearby results.'}
              </p>
              <Button 
                type="button" 
                onClick={() => navigate('/search')}
                className="rounded-2xl px-8 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {t.searchBtn}
              </Button>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50 opacity-40 blur-3xl"></div>
        </section>

        {/* Symptom Checker Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-bold text-white">{t.notSure}</h2>
            <p className="mt-1 text-sm text-indigo-100 opacity-90">{t.describeSymptoms}</p>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              <div className="relative group">
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-base text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none placeholder:text-slate-400"
                  rows={4}
                  placeholder={t.symptomPlaceholder}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Button 
                  type="button" 
                  onClick={handleSuggest} 
                  disabled={loading}
                  className="rounded-2xl px-10 h-12 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      <span>{t.loading || 'Finding...'}</span>
                    </div>
                  ) : t.findSpecialist}
                </Button>

                {error && (
                  <div className="flex items-center gap-2 text-sm font-bold text-red-500 animate-in shake-in duration-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 animate-in zoom-in-95 duration-500">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">{t.weSuggest}</p>
                  <div className="flex flex-wrap gap-3">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="group relative flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white hover:shadow-indigo-200 active:scale-95"
                        onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
                      >
                        {s}
                        <svg className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

