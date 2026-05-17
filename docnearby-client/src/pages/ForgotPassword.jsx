import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO.jsx";
import { authApi } from "../services/api.js";
import { PATH_PAGE } from "../routes/paths.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset({
        email: email.trim().toLowerCase(),
      });
      setMessage(
        res?.message ||
          "If an account exists with this email, a reset link has been sent.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send reset instructions.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-medical-grey flex items-center justify-center px-4 py-12"
      id="main-content"
    >
      <SEO
        title="Forgot Password"
        description="Reset your DocNearby password securely with a reset link delivered by email."
        keywords="forgot password, reset password, healthcare portal password recovery"
      />

      <div className="w-full max-w-md animate-in fade-in duration-1000">
        <div className="medical-card p-10 md:p-12 !shadow-2xl">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-secondary tracking-tight">
              Forgot Password
            </h1>
            <p
              className="mt-2 text-sm font-bold text-medical-text-light leading-relaxed"
              aria-live="polite"
            >
              Enter your registered email and we'll send you a secure reset
              link.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="medical-label">
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="medical-input !py-4 focus:ring-primary"
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-5 !text-base disabled:opacity-50 shadow-xl shadow-primary/20 focus-visible:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Sending Reset Link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {(error || message) && (
            <div
              className={`mt-8 p-4 rounded-2xl border font-bold text-sm flex items-center gap-3 ${
                error
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}
              role="alert"
            >
              {error || message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 text-center text-sm font-semibold text-medical-text-light">
            <button
              type="button"
              onClick={() => navigate(PATH_PAGE.login)}
              className="text-primary hover:text-secondary focus:outline-none focus:underline"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
