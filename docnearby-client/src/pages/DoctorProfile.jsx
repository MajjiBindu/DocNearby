import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/common/Spinner.jsx'
import DoctorProfileView from '../components/doctor/DoctorProfile.jsx'
import { doctorApi, reviewApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/formatDate.js'

export default function DoctorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [fetchingReviews, setFetchingReviews] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (userRating < 1) return setFormError('Please select a rating.')
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
        setFormError(e?.message || 'Failed to submit review.')
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

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count)
  }

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

      {/* Reviews Section */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Patient Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>

        {fetchingReviews ? (
          <Spinner />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{r.patientId?.name || 'Patient'}</p>
                    <p className="text-yellow-500 text-sm">{renderStars(r.rating)}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                </div>
                {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Write a Review Form */}
        {token && user?.role === 'patient' && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-md font-semibold text-slate-900 mb-3">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className={`text-2xl ${userRating >= star ? 'text-yellow-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-lg border p-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

