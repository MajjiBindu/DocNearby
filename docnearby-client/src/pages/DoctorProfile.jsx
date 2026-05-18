import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../components/common/SEO.jsx";
import { doctorApi, reviewApi } from "../services/api.js";
import { useAuth } from "../context/useAuth.js";
import translations from "../utils/i18n.js";

const formatReviewDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

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
  const doctorId = doctor?._id || id;

  const fetchReviews = useCallback(async () => {
    setFetchingReviews(true);
    try {
      const res = await reviewApi.byDoctor(id);
      setReviews(res?.data?.reviews || []);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setFetchingReviews(false);
    }
  }, [id]);

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
  }, [id, fetchReviews]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (userRating < 1) return setFormError("Please select a star rating.");
    setFormError("");
    setSubmitting(true);
    try {
      await reviewApi.create({
        doctorId,
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
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <svg
            key={s}
            className={`${starClass} ${s <= rating ? "fill-primary text-primary" : "text-slate-200"}`}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const totalReviews = reviews?.length || 0;
  const avgRating = totalReviews > 0
    ? Number((reviews.reduce((acc, r) => acc + (r?.rating || 0), 0) / totalReviews).toFixed(1))
    : 0;

  // Star breakdown counts
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (Array.isArray(reviews)) {
    reviews.forEach((r) => {
      const rating = r?.rating;
      if (rating >= 1 && rating <= 5) {
        starCounts[rating]++;
      }
    });
  }

  return (
    <main
      className="bg-medical-grey min-h-screen pb-20 pt-8 sm:pt-12"
      id="main-content"
    >
      <SEO
        title={`${doctor?.userId?.name || "Doctor Profile"} | ${doctor?.specialty || "Specialist"}`}
        description={`View ${doctor?.userId?.name}'s profile, clinical qualifications, patient reviews, and consultation fees. Book an appointment at ${clinic?.name || "the clinic"} in ${clinic?.city || "your area"}.`}
        schemaType="MedicalBusiness"
        schemaData={
          doctor
            ? {
                "@context": "https://schema.org",
                "@type": "Physician",
                name: doctor.userId?.name,
                medicalSpecialty: doctor.specialty,
                description: `Certified specialist with ${doctor.experience} years of experience.`,
                address: clinic
                  ? {
                      "@type": "PostalAddress",
                      streetAddress: clinic.address,
                      addressLocality: clinic.city,
                      addressRegion: clinic.state,
                      postalCode: clinic.pincode,
                    }
                  : undefined,
                aggregateRating:
                  totalReviews > 0
                    ? {
                        "@type": "AggregateRating",
                        ratingValue: avgRating,
                        reviewCount: totalReviews,
                      }
                    : undefined,
              }
            : null
        }
      />

      <div className="section-container">
        {loading && !doctor && (
          <div
            className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
            aria-busy="true"
          >
            <div
              className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
              aria-hidden="true"
            ></div>
            <p className="font-bold text-medical-text-light">{t.loading}</p>
          </div>
        )}

        {error && (
          <div
            className="medical-card p-6 border-red-100 bg-red-50 text-red-600 font-bold mb-8"
            role="alert"
          >
            {error}
          </div>
        )}

        {doctor && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Profile Card */}
            <article
              className="medical-card p-8 md:p-12 relative overflow-hidden"
              aria-labelledby="doctor-name"
            >
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div
                    className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-16 h-16 md:w-20 md:h-20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="text-center md:text-left space-y-4">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black uppercase tracking-wider"
                      role="status"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Specialist
                    </div>
                    <h1
                      id="doctor-name"
                      className="text-4xl md:text-5xl font-black text-secondary tracking-tight"
                    >
                      {doctor?.userId?.name || "Doctor"}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-primary tracking-tight">
                      {doctor.specialty}
                    </p>
                    <div
                      className="flex flex-wrap justify-center md:justify-start gap-3"
                      aria-label="Qualifications"
                    >
                      {doctor.qualifications?.map((q) => (
                        <span
                          key={q}
                          className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-medical-text"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-6 bg-slate-50 lg:bg-transparent p-8 lg:p-0 rounded-3xl border border-slate-100 lg:border-none">
                  <div className="text-center lg:text-right">
                    <p className="text-xs font-black text-medical-text-light uppercase tracking-widest mb-1">
                      Consultation Fee
                    </p>
                    <p
                      className="text-4xl font-black text-secondary"
                      aria-label={`Fee: ${doctor.consultationFee} rupees`}
                    >
                      ₹{doctor.consultationFee ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/book/${doctorId}`)}
                    className="btn-primary !px-12 !py-5 !text-xl w-full sm:w-auto focus-visible:ring-offset-2"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar Info */}
              <aside
                className="lg:col-span-1 space-y-8"
                aria-labelledby="clinic-info-heading"
              >
                {clinic && (
                  <section className="medical-card p-8 space-y-8">
                    <div>
                      <h2
                        id="clinic-info-heading"
                        className="text-lg font-black text-secondary uppercase tracking-tight mb-6 flex items-center gap-3"
                      >
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {t.clinicLocation}
                      </h2>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="font-extrabold text-secondary">
                            {clinic.name}
                          </p>
                          <address className="mt-2 text-sm text-medical-text-light font-medium leading-relaxed not-italic">
                            {clinic.address}, {clinic.city}, {clinic.state} -{" "}
                            {clinic.pincode}
                          </address>
                        </div>
                        {mapSrc && (
                          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm aspect-video">
                            <iframe
                              title={`Map location for ${clinic.name}`}
                              src={mapSrc}
                              className="w-full h-full"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-secondary uppercase tracking-tight mb-4">
                        Languages Spoken
                      </h2>
                      <div className="flex flex-wrap gap-2" role="list">
                        {doctor.languages?.map((l) => (
                          <span
                            key={l}
                            role="listitem"
                            className="text-sm font-bold text-medical-text-light flex items-center gap-1"
                          >
                            <svg
                              className="w-4 h-4 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
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
              <section
                className="lg:col-span-2 space-y-8"
                aria-labelledby="reviews-heading"
              >
                <div className="medical-card p-8">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <h2
                      id="reviews-heading"
                      className="text-2xl font-black text-secondary tracking-tight"
                    >
                      {t.patientReviews}
                    </h2>
                  </div>

                  {/* Premium Summary and Star Breakdown */}
                  {totalReviews > 0 && !fetchingReviews && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 mb-10 rounded-2xl bg-slate-50 border border-slate-100 animate-in fade-in duration-300">
                      {/* Left: Overall Rating */}
                      <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200/60">
                        <p className="text-5xl font-black text-secondary mb-1">
                          {avgRating.toFixed(1)}
                        </p>
                        <div className="mb-2">
                          {renderStars(avgRating, "lg")}
                        </div>
                        <p className="text-sm font-bold text-medical-text-light">
                          Based on {totalReviews} patient {totalReviews === 1 ? 'review' : 'reviews'}
                        </p>
                      </div>

                      {/* Right: Star Breakdown Bars */}
                      <div className="col-span-1 md:col-span-2 flex flex-col justify-center space-y-2.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = starCounts[star] || 0;
                          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-4">
                              <span className="text-sm font-bold text-secondary w-14 whitespace-nowrap">
                                {star} {star === 1 ? 'star' : 'stars'}
                              </span>
                              <div className="flex-1 h-3 rounded-full bg-slate-200/80 overflow-hidden relative shadow-inner">
                                <div
                                  className="absolute top-0 left-0 h-full rounded-full bg-primary shadow-sm transition-all duration-500 ease-out"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-medical-text-light w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {fetchingReviews ? (
                    <div
                      className="flex h-40 items-center justify-center"
                      aria-busy="true"
                    >
                      <div
                        className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
                        aria-hidden="true"
                      ></div>
                    </div>
                  ) : totalReviews === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div
                        className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-10 h-10"
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
                      <p className="text-medical-text-light font-bold">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8" role="list">
                      {reviews.map((r) => {
                        if (!r) return null;
                        return (
                          <article
                            key={r._id}
                            role="listitem"
                            className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 hover:border-primary transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-12 h-12 rounded-xl bg-secondary text-white flex items-center justify-center font-black text-xl"
                                  aria-hidden="true"
                                >
                                  {(r.patientId?.name || "P").charAt(0)}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-extrabold text-secondary">
                                      {r.patientId?.name || "Patient"}
                                    </p>
                                    {r.isVerified && (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wider"
                                        role="status"
                                      >
                                        <svg
                                          className="w-3 h-3 text-emerald-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          aria-hidden="true"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        {t.verifiedPatient || "Verified Patient"}
                                      </span>
                                    )}
                                  </div>
                                  {renderStars(r.rating || 0)}
                                </div>
                              </div>
                              <time
                                dateTime={r.createdAt}
                                className="text-[10px] font-black text-medical-text-light uppercase tracking-widest"
                              >
                                {formatReviewDate(r.createdAt)}
                              </time>
                            </div>
                            <blockquote className="text-medical-text text-sm leading-relaxed font-medium italic">
                              "{r.comment ?? ""}"
                            </blockquote>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {/* Review Form */}
                  {token && user?.role === "patient" && (
                    <section
                      className="mt-16 pt-12 border-t border-slate-100"
                      aria-labelledby="write-review-heading"
                    >
                      <h3
                        id="write-review-heading"
                        className="text-xl font-extrabold text-secondary tracking-tight mb-8"
                      >
                        {t.shareExperience}
                      </h3>
                      <form onSubmit={handleReviewSubmit} className="space-y-8">
                        <div className="space-y-4">
                          <label
                            id="star-rating-label"
                            className="medical-label"
                          >
                            Select Star Rating
                          </label>
                          <div
                            className="flex gap-3"
                            role="radiogroup"
                            aria-labelledby="star-rating-label"
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={userRating === star}
                                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setUserRating(star)}
                                className="group relative h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm transition-all active:scale-90 focus:ring-2 focus:ring-primary outline-none"
                              >
                                <svg
                                  className={`w-8 h-8 transition-all ${
                                    (hoverRating || userRating) >= star
                                      ? "text-primary fill-primary"
                                      : "text-slate-100"
                                  }`}
                                  viewBox="0 0 20 20"
                                  aria-hidden="true"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {userRating === star && (
                                  <div
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse"
                                    aria-hidden="true"
                                  ></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label
                            htmlFor="review-comment"
                            className="medical-label"
                          >
                            Your Experience
                          </label>
                          <textarea
                            id="review-comment"
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            maxLength={500}
                            className="medical-input min-h-[160px] resize-none text-lg focus:ring-primary"
                            placeholder="Share your thoughts on the care you received..."
                            aria-required="true"
                          />
                          <div className="flex justify-end">
                            <span
                              className="text-[10px] font-black text-medical-text-light uppercase tracking-widest"
                              aria-live="polite"
                            >
                              {userComment.length}/500 characters
                            </span>
                          </div>
                        </div>

                        {formError && (
                          <div
                            className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm flex items-center gap-3"
                            role="alert"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
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
                          className="btn-primary w-full !py-5 !text-lg disabled:opacity-50 focus-visible:ring-offset-2"
                          aria-live="polite"
                        >
                          {submitting ? "Publishing..." : t.publishReview}
                        </button>
                      </form>
                    </section>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
