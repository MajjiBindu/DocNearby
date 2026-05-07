import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/common/Spinner.jsx'
import DoctorProfileView from '../components/doctor/DoctorProfile.jsx'
import { doctorApi, reviewApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/formatDate.js'
import translations from '../utils/i18n.js'

export default function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en')
  const [loading, setLoading] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [fetchingReviews, setFetchingReviews] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('dn_lang') || 'en')
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  const t = translations[lang]

  const fetchReviews = async () => {
    setFetchingReviews(true)
    try {
      const res = await reviewApi.byDoctor(id)
      setReviews(res?.data?.reviews || [])
    } catch (e) {
      console.error('Failed to fetch reviews', e)
    } finally {
      setFetchingReviews(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await doctorApi.get(id)
        if (!cancelled) {
          setDoctor(res?.data?.doctor || null)
          fetchReviews()
        }
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (userRating < 1) return setFormError('Please select a star rating.')
    setFormError('')
    setSubmitting(true)
    try {
      await reviewApi.create({ doctorId: id, rating: userRating, comment: userComment })
      setUserRating(0)
      setUserComment('')
      fetchReviews()
    } catch (e) {
      if (e.response?.status === 409) {
        setFormError('You have already reviewed this doctor.')
      } else {
        setFormError(e?.response?.data?.message || e?.message || 'Failed to submit review.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const clinic = doctor?.clinicId
  const coords = clinic?.location?.coordinates
  const mapSrc =
    coords?.length === 2
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[0] - 0.01}%2C${coords[1] - 0.01}%2C${coords[0] + 0.01}%2C${coords[1] + 0.01}&layer=mapnik&marker=${coords[1]}%2C${coords[0]}`
      : null

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= rating ? 'text-amber-400' : 'text-slate-200'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatReviewDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(lang === 'en' ? 'en-US' : (lang === 'hi' ? 'hi-IN' : 'te-IN'), {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        {/* Full Page Loading */}
        {loading && !doctor && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
            <Spinner className="h-10 w-10 text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-in fade-in zoom-in-95">
             <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
          </div>
        )}

        {doctor && (
          <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <DoctorProfileView doctor={doctor} onBook={() => navigate(`/book/${id}`)} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Clinic & Map */}
              <div className="lg:col-span-1 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                {clinic && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {t.clinicLocation}
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold text-slate-800">{clinic.name}</p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
                        </p>
                      </div>
                      {mapSrc && (
                        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
                          <iframe title="map" src={mapSrc} className="h-48 w-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500" loading="lazy" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">{t.patientReviews}</h2>
                      <div className="flex items-center gap-2">
                        {reviews.length > 0 && (
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                            {reviews.length} Reviews
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {fetchingReviews ? (
                      <div className="flex h-40 items-center justify-center">
                        <Spinner className="text-indigo-500" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="rounded-full bg-slate-50 p-4">
                          <svg className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((r) => (
                          <div key={r._id} className="group relative rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-all hover:bg-white hover:shadow-md">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                  {(r.patientId?.name || 'P').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{r.patientId?.name || 'Patient'}</p>
                                  {renderStars(r.rating)}
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatReviewDate(r.createdAt)}</p>
                            </div>
                            {r.comment && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write a Review Form */}
                    {token && user?.role === 'patient' && (
                      <div className="mt-12 border-t border-slate-100 pt-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{t.shareExperience}</h3>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setUserRating(star)}
                                  className="group relative h-10 w-10 outline-none transition-transform active:scale-90"
                                >
                                  <span className={`text-3xl transition-colors duration-200 ${
                                    (hoverRating || userRating) >= star ? 'text-amber-400' : 'text-slate-200'
                                  }`}>
                                    ★
                                  </span>
                                  {userRating === star && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400"></span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Feedback</label>
                            <textarea
                              value={userComment}
                              onChange={(e) => setUserComment(e.target.value)}
                              maxLength={500}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none placeholder:text-slate-400"
                              rows={4}
                              placeholder="What did you like or dislike about your visit?"
                            />
                            <div className="flex justify-end">
                              <span className="text-[10px] font-bold text-slate-400">{userComment.length}/500</span>
                            </div>
                          </div>

                          {formError && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600 animate-in shake-in duration-300">
                              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submitting}
                            className="group w-full relative overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
                          >
                            {submitting ? (
                              <div className="flex items-center justify-center gap-2">
                                <Spinner className="h-4 w-4 border-t-white" />
                                <span>{t.loading}</span>
                              </div>
                            ) : (
                              t.publishReview
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

