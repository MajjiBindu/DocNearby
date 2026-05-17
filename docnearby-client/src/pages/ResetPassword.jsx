import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../components/common/SEO.jsx";
import { authApi } from "../services/api.js";
import { PATH_PAGE } from "../routes/paths.js";

const passwordRules = [
  "At least 8 characters",
  "One uppercase character",
  "One lowercase character",
  "One number",
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() =>
    token ? "" : "Reset token is missing or invalid.",
  );
  const [success, setSuccess] = useState("");

  const validatePassword = () => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password))
      return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(password))
      return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(password))
      return "Password must include at least one number.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, password });
      setSuccess(res?.message || "Password reset successful.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate(PATH_PAGE.login), 3000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to reset your password.",
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
        title="Reset Password"
        description="Restore secure access to DocNearby by creating a new password for your account."
        keywords="reset password, password recovery, healthcare portal reset"
      />

      <div className="w-full max-w-md animate-in fade-in duration-1000">
        <div className="medical-card p-10 md:p-12 !shadow-2xl">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-secondary tracking-tight">
              Reset Your Password
            </h1>
            <p
              className="mt-2 text-sm font-bold text-medical-text-light leading-relaxed"
              aria-live="polite"
            >
              Choose a strong password to keep your healthcare information
              secure.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="password" className="medical-label">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="medical-input !py-4 focus:ring-primary pr-14"
                  required
                  aria-required="true"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-medical-text-light hover:text-secondary focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="medical-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="medical-input !py-4 focus:ring-primary pr-14"
                  required
                  aria-required="true"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((show) => !show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-medical-text-light hover:text-secondary focus:outline-none"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="grid gap-2 text-xs text-medical-text-light">
              {passwordRules.map((rule) => (
                <p key={rule} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                  {rule}
                </p>
              ))}
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
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          {(error || success) && (
            <div
              className={`mt-8 p-4 rounded-2xl border font-bold text-sm flex items-center gap-3 ${
                error
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}
              role="alert"
            >
              {error || success}
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
