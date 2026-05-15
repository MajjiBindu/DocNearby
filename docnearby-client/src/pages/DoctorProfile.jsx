import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
import { doctorApi, reviewApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
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

  const renderStars = (rating, size = "sm") => {
    const starClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`${starClass} ${s <= rating ? "fill-primary text-primary" : "text-slate-200"}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatReviewDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "te-IN",
      { month: "short", day: "numeric", year: "numeric" }
    );
  };

  return (
    <div className="bg-medical-grey min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-container">
        {loading && !doctor && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="font-bold text-medical-text-light">{t.loading}</p>
          </div>
        )}

        {error && (
          <div className="medical-card p-6 border-red-100 bg-red-50 text-red-600 font-bold mb-8">
            {error}
          </div>
        )}

        {doctor && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Profile Card */}
            <section className="medical-card p-8 md:p-12 relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl">
                    <svg className="w-16 h-16 md:w-20 md:h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-center md:text-left space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Specialist
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">
                      {doctor?.userId?.name || "Doctor"}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-primary tracking-tight">
                      {doctor.specialty}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {doctor.qualifications?.map((q) => (
                        <span key={q} className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-medical-text">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-6 bg-slate-50 lg:bg-transparent p-8 lg:p-0 rounded-3xl border border-slate-100 lg:border-none">
                  <div className="text-center lg:text-right">
                    <p className="text-xs font-black text-medical-text-light uppercase tracking-widest mb-1">Consultation Fee</p>
                    <p className="text-4xl font-black text-secondary">₹{doctor.consultationFee ?? "—"}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/book/${id}`)}
                    className="btn-primary !px-12 !py-5 !text-xl w-full sm:w-auto"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar Info */}
              <aside className="lg:col-span-1 space-y-8">
                {clinic && (
                  <section className="medical-card p-8 space-y-8">
                    <div>
                      <h2 className="text-lg font-black text-secondary uppercase tracking-tight mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {t.clinicLocation}
                      </h2>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="font-extrabold text-secondary">{clinic.name}</p>
                          <p className="mt-2 text-sm text-medical-text-light font-medium leading-relaxed">
                            {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
                          </p>
                        </div>
                        {mapSrc && (
                          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm aspect-video">
                            <iframe
                              title="clinic-map"
                              src={mapSrc}
                              className="w-full h-full"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-secondary uppercase tracking-tight mb-4">Languages</h2>
                      <div className="flex flex-wrap gap-2">
                        {doctor.languages?.map((l) => (
                          <span key={l} className="text-sm font-bold text-medical-text-light flex items-center gap-1">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </aside>

              {/* Main Content: Reviews */}
              <main className="lg:col-span-2 space-y-8">
                <section className="medical-card p-8">
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                    <h2 className="text-2xl font-extrabold text-secondary tracking-tight">
                      {t.patientReviews}
                    </h2>
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-secondary">{doctor.rating?.toFixed(1) || "0.0"}</p>
                          <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">{reviews.length} Total</p>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                          {renderStars(doctor.rating, "lg")}
                        </div>
                      </div>
                    )}
                  </div>

                  {fetchingReviews ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                      <p className="text-medical-text-light font-bold">No reviews yet. Be the first to share your experience!</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {reviews.map((r) => (
                        <div key={r._id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 hover:border-primary transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-secondary text-white flex items-center justify-center font-black text-xl">
                                {(r.patientId?.name || "P").charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-secondary">{r.patientId?.name || "Patient"}</p>
                                {renderStars(r.rating)}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                              {formatReviewDate(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-medical-text text-sm leading-relaxed font-medium italic">
                            "{r.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review Form */}
                  {token && user?.role === "patient" && (
                    <div className="mt-16 pt-12 border-t border-slate-100">
                      <h3 className="text-xl font-extrabold text-secondary tracking-tight mb-8">
                        {t.shareExperience}
                      </h3>
                      <form onSubmit={handleReviewSubmit} className="space-y-8">
                        <div className="space-y-4">
                          <label className="medical-label">Select Star Rating</label>
                          <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setUserRating(star)}
                                className="group relative h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm transition-all active:scale-90"
                              >
                                <svg 
                                  className={`w-8 h-8 transition-all ${
                                    (hoverRating || userRating) >= star ? "text-primary fill-primary" : "text-slate-100"
                                  }`} 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {userRating === star && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="medical-label">Your Experience</label>
                          <textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            maxLength={500}
                            className="medical-input min-h-[160px] resize-none text-lg"
                            placeholder="Share your thoughts on the care you received..."
                          />
                          <div className="flex justify-end">
                            <span className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                              {userComment.length}/500
                            </span>
                          </div>
                        </div>

                        {formError && (
                          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-primary w-full !py-5 !text-lg disabled:opacity-50"
                        >
                          {submitting ? "Publishing..." : t.publishReview}
                        </button>
                      </form>
                    </div>
                  )}
                </section>
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
