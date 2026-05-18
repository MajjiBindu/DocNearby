import { formatDate } from "../../utils/formatDate.js";
import { memo, useState, useEffect } from "react";
import Modal from "../common/Modal.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { reviewApi } from "../../services/api.js";

const AppointmentCard = memo(({ appt, onCancel, onComplete }) => {
  const isPending = appt?.status === 'pending';
  const isConfirmed = appt?.status === 'confirmed';

  const auth = useAuth();
  const user = auth?.user;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    let active = true;
    const doctorId = appt?.doctorId?._id;
    const userId = user?._id || user?.id;
    const isCompleted = appt?.status === 'completed';
    const isPatient = user?.role === 'patient';

    if (isCompleted && doctorId && userId && isPatient) {
      reviewApi.byDoctor(doctorId)
        .then((res) => {
          if (!active) return;
          const reviewsList = res?.data?.reviews || [];
          const alreadyReviewed = reviewsList.some(r => {
            const reviewerId = r?.patientId?._id || r?.patientId;
            return reviewerId && String(reviewerId) === String(userId);
          });
          setHasReviewed(alreadyReviewed);
        })
        .catch((err) => {
          console.error("Error checking review status:", err);
        });
    }
    return () => {
      active = false;
    };
  }, [appt?.status, appt?.doctorId?._id, user?._id, user?.id, user?.role]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await reviewApi.create({
        doctorId: appt?.doctorId?._id,
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      setHasReviewed(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setRating(0);
        setComment("");
        setSuccess(false);
      }, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("You have already reviewed this doctor.");
        setHasReviewed(true);
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to submit review. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showLeaveReview = appt?.status === 'completed' && user?.role === 'patient';

  return (
    <article className="rounded-xl border bg-white p-4 md:p-6 shadow-sm focus-within:ring-2 focus-within:ring-primary outline-none">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 text-sm md:text-base">
            {appt?.doctorId?.userId?.name || "Doctor"} •{" "}
            <span className="text-primary">{appt?.doctorId?.specialty || "General Specialist"}</span>
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            <time dateTime={appt?.date}>{formatDate(appt?.date)}</time> • {appt?.slot}
          </p>
          <address className="mt-1 text-xs md:text-sm text-slate-500 not-italic">
            {appt?.clinicId?.name || "Clinic"}
          </address>
        </div>
        <span 
          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest self-start ${
            appt?.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
            appt?.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
            appt?.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
          }`}
          role="status"
        >
          {appt?.status}
        </span>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2">
        {onCancel ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md border px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            onClick={onCancel}
            aria-label={`Cancel appointment with Dr. ${appt?.doctorId?.userId?.name}`}
          >
            Cancel
          </button>
        ) : null}
        {onComplete ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-secondary px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            onClick={onComplete}
            aria-label={`Mark appointment with Dr. ${appt?.doctorId?.userId?.name} as completed`}
          >
            Mark completed
          </button>
        ) : null}
        
        {showLeaveReview && (
          hasReviewed ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-600 border border-emerald-100 self-start">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Reviewed
            </span>
          ) : (
            <button
              type="button"
              className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none self-start"
              onClick={() => setIsModalOpen(true)}
              aria-label={`Leave a review for Dr. ${appt?.doctorId?.userId?.name}`}
            >
              Leave Review
            </button>
          )
        )}
      </div>

      <Modal open={isModalOpen} title="Leave Post-Visit Review" onClose={() => { if (!submitting) setIsModalOpen(false); }}>
        <div className="space-y-6 py-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm" aria-hidden="true">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900">Thank You!</h4>
              <p className="text-sm text-slate-500 max-w-xs">
                Your feedback has been successfully submitted and helps other patients choose the right care.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <p className="text-sm text-slate-600">
                Please rate your overall experience with Dr. {appt?.doctorId?.userId?.name || "your doctor"}.
              </p>

              <div className="space-y-2 text-center">
                <label id="modal-star-rating-label" className="block text-sm font-semibold text-slate-700">
                  Select Star Rating
                </label>
                <div
                  className="flex justify-center gap-3 py-2"
                  role="radiogroup"
                  aria-labelledby="modal-star-rating-label"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="group relative h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:border-primary active:scale-90 focus:ring-2 focus:ring-primary outline-none"
                    >
                      <svg
                        className={`w-8 h-8 transition-all ${
                          (hoverRating || rating) >= star
                            ? "text-primary fill-primary scale-110"
                            : "text-slate-200"
                        }`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="modal-review-comment" className="block text-sm font-semibold text-slate-700">
                  Write Your Review (Optional)
                </label>
                <textarea
                  id="modal-review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                  placeholder="Share your thoughts on the care you received..."
                />
                <div className="flex justify-end text-xs text-slate-400">
                  {comment.length}/500 characters
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm flex items-center gap-3 animate-in shake-in duration-300" role="alert">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all focus:outline-none"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-95 focus:outline-none"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </article>
  );
});

export default AppointmentCard;
