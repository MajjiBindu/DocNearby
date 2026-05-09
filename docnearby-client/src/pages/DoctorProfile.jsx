import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
// Removed DoctorProfileView import to inline it here for better theme control
import { doctorApi, reviewApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/formatDate.js";
import translations from "../utils/i18n.js";

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const handleLangChange = () =>
      setLang(localStorage.getItem("dn_lang") || "en");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  const fetchReviews = async () => {
    setFetchingReviews(true);
    try {
      const res = await reviewApi.byDoctor(id);
      setReviews(res?.data?.reviews || []);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setFetchingReviews(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await doctorApi.get(id);
        if (!cancelled) {
          setDoctor(res?.data?.doctor || null);
          fetchReviews();
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load doctor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (userRating < 1) return setFormError("Please select a star rating.");
    setFormError("");
    setSubmitting(true);
    try {
      await reviewApi.create({
        doctorId: id,
        rating: userRating,
        comment: userComment,
      });
      setUserRating(0);
      setUserComment("");
      fetchReviews();
    } catch (e) {
      if (e.response?.status === 409) {
        setFormError("You have already reviewed this doctor.");
      } else {
        setFormError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to submit review.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clinic = doctor?.clinicId;
  const coords = clinic?.location?.coordinates;
  const mapSrc =
    coords?.length === 2
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[0] - 0.01}%2C${coords[1] - 0.01}%2C${coords[0] + 0.01}%2C${coords[1] + 0.01}&layer=mapnik&marker=${coords[1]}%2C${coords[0]}`
      : null;

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className={s <= rating ? "text-redline" : "text-slate-200"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatReviewDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "te-IN",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
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
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {doctor && (
          <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-blue-popsicle to-purple-shadow p-8 md:p-12 shadow-2xl shadow-black/30">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                  <div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                      {doctor?.userId?.name || "Doctor"}
                    </h1>
                    <p className="mt-4 text-xl md:text-2xl font-bold text-redline tracking-tight">
                      {doctor.specialty}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 text-sm font-semibold backdrop-blur-md">
                        <svg className="h-4 w-4 text-redline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        {doctor.qualifications?.join(", ")}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 text-sm font-semibold backdrop-blur-md">
                         <svg className="h-4 w-4 text-redline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                         </svg>
                         {doctor.languages?.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block mb-1">Consultation Fee</span>
                      <span className="text-3xl font-black text-white">₹{doctor.consultationFee ?? "—"}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/book/${id}`)}
                      className="w-full md:w-auto px-10 py-5 rounded-2xl bg-redline text-white font-black text-lg hover:bg-redline/90 shadow-2xl shadow-redline/40 transition-all active:scale-95 border-none"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>

                {/* Decorative glow */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-redline/20 blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-popsicle/40 blur-3xl"></div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Clinic & Map */}
              <div className="lg:col-span-1 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                {clinic && (
                  <div className="rounded-[2.5rem] border border-grey-blue-leaf/10 bg-white p-8 shadow-2xl shadow-grey-blue-leaf/5">
                    <h2 className="text-xl font-black text-blue-popsicle mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-popsicle/5 text-blue-popsicle">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      {t.clinicLocation}
                    </h2>
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="font-black text-blue-popsicle text-lg">
                          {clinic.name}
                        </p>
                        <p className="mt-2 text-sm text-grey-blue-leaf font-medium leading-relaxed">
                          {clinic.address}, {clinic.city}, {clinic.state} -{" "}
                          {clinic.pincode}
                        </p>
                      </div>
                      {mapSrc && (
                        <div className="overflow-hidden rounded-3xl border border-grey-blue-leaf/10 shadow-inner">
                          <iframe
                            title="map"
                            src={mapSrc}
                            className="h-64 w-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="lg:col-span-2 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                <section className="rounded-[2.5rem] border border-grey-blue-leaf/10 bg-white shadow-2xl shadow-grey-blue-leaf/5 overflow-hidden">
                  <div className="border-b border-grey-blue-leaf/10 bg-blue-popsicle px-8 py-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {t.patientReviews}
                      </h2>
                      <div className="flex items-center gap-2">
                        {reviews.length > 0 && (
                          <span className="rounded-xl bg-white/10 px-4 py-1.5 text-xs font-black text-white uppercase tracking-wider">
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
                          <svg
                            className="h-8 w-8 opacity-20"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">
                          No reviews yet. Be the first to share your experience!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {reviews.map((r) => (
                          <div
                            key={r._id}
                            className="group relative rounded-[2rem] border border-grey-blue-leaf/5 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-grey-blue-leaf/5"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-popsicle to-purple-shadow flex items-center justify-center text-white text-lg font-black shadow-lg">
                                  {(r.patientId?.name || "P").charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">
                                    {r.patientId?.name || "Patient"}
                                  </p>
                                  {renderStars(r.rating)}
                                </div>
                              </div>
                              <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em]">
                                {formatReviewDate(r.createdAt)}
                              </p>
                            </div>
                            {r.comment && (
                              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                {r.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write a Review Form */}
                    {token && user?.role === "patient" && (
                      <div className="mt-16 border-t border-grey-blue-leaf/10 pt-12">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-redline text-white shadow-xl shadow-redline/20">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-black text-blue-popsicle tracking-tight">
                            {t.shareExperience}
                          </h3>
                        </div>

                        <form
                          onSubmit={handleReviewSubmit}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em]">
                              Your Rating
                            </label>
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
                                  <span
                                    className={`text-4xl transition-all duration-300 ${
                                      (hoverRating || userRating) >= star
                                        ? "text-redline drop-shadow-[0_0_8px_rgba(158,54,58,0.4)]"
                                        : "text-slate-200"
                                    }`}
                                  >
                                    ★
                                  </span>
                                  {userRating === star && (
                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-redline"></span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em]">
                              Your Feedback
                            </label>
                            <textarea
                              value={userComment}
                              onChange={(e) => setUserComment(e.target.value)}
                              maxLength={500}
                              className="w-full rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 p-6 text-base text-slate-700 transition-all focus:bg-white focus:ring-8 focus:ring-blue-popsicle/5 focus:border-blue-popsicle/20 outline-none placeholder:text-slate-300 shadow-inner"
                              rows={4}
                              placeholder="What did you like or dislike about your visit?"
                            />
                            <div className="flex justify-end">
                                <span className="text-[10px] font-black text-grey-blue-leaf/30">
                                {userComment.length}/500
                              </span>
                            </div>
                          </div>

                          {formError && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600 animate-in shake-in duration-300">
                              <svg
                                className="h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {formError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submitting}
                            className="group w-full relative overflow-hidden rounded-2xl bg-redline py-5 text-lg font-black text-white shadow-2xl shadow-redline/20 transition-all hover:bg-redline/90 active:scale-[0.98] disabled:opacity-50 border-none"
                          >
                            {submitting ? (
                              <div className="flex items-center justify-center gap-3">
                                <Spinner className="h-5 w-5 border-t-white" />
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
  );
}
