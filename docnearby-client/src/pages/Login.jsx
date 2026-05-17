import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../components/auth/OtpInput.jsx";
import SEO from "../components/common/SEO.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { PATH_PAGE } from "../routes/paths.js";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "patient",
};

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const email = useMemo(() => form.email.trim().toLowerCase(), [form.email]);
  const otpPurpose = mode === "signup" ? "signup" : "login";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "doctor" ? "/doctor" : "/patient", {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  // Resend Timer logic
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const validateCredentials = () => {
    if (mode === "signup" && !form.name.trim()) return "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid email address.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    return "";
  };

  const requestOtp = async () => {
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res =
        mode === "signup"
          ? await authApi.requestSignupOtp({
              name: form.name.trim(),
              email,
              password: form.password,
              role: form.role,
            })
          : await authApi.requestLoginOtp({ email, password: form.password });

      if (res?.success) {
        setStep("otp");
        setOtp("");
        setResendTimer(60);
        setMessage(
          res.message || "Security code dispatched to your clinical email.",
        );
      } else {
        setError(res?.message || "Protocol failure: OTP not sent.");
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Network error in OTP dispatch.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res =
        mode === "signup"
          ? await authApi.verifySignupOtp({ email, otp })
          : await authApi.verifyLoginOtp({ email, otp });

      if (res?.success) {
        const nextUser = res.data?.user || null;
        setToken(res.data?.token || "");
        setUser(nextUser);
      } else {
        setError(res?.message || "Authentication failed: Invalid code.");
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Verification gateway timeout.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.resendOtp({ email, purpose: otpPurpose });
      if (res?.success) {
        setResendTimer(60);
        setMessage("Security code resent successfully.");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(initialForm);
    setOtp("");
    setStep("credentials");
    setMessage("");
    setError("");
    setResendTimer(0);
  };

  return (
    <main
      className="min-h-screen bg-medical-grey flex items-center justify-center px-4 py-12"
      id="main-content"
    >
      <SEO
        title={mode === "signup" ? "Create Your Account" : "Secure Login"}
        description="Access your DocNearby healthcare dashboard. Secure login for patients and clinicians with two-factor authentication."
        keywords="healthcare login, medical portal access, patient registration, clinical dashboard login"
      />

      <div className="w-full max-w-[460px] animate-in fade-in duration-1000">
        <div className="flex flex-col items-center mb-10" aria-hidden="true">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-primary/30 mb-4 animate-in zoom-in duration-700">
            D
          </div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">
            DocNearby
          </h2>
          <p className="text-medical-text-light font-bold text-sm tracking-widest uppercase mt-1 opacity-60">
            Clinical Access Portal
          </p>
        </div>

        <div className="medical-card p-10 md:p-12 !shadow-2xl">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-secondary tracking-tight">
              {mode === "signup" ? "New Enrollment" : "Clinical Login"}
            </h1>
            <p
              className="mt-2 text-sm font-bold text-medical-text-light leading-relaxed"
              aria-live="polite"
            >
              {step === "otp"
                ? `Enter the 6-digit clinical verification code sent to ${email}`
                : "Secure biometric-grade access to your healthcare dashboard"}
            </p>
          </header>

          {step === "credentials" && (
            <nav
              className="mb-8 flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100"
              aria-label="Authentication modes"
            >
              <button
                onClick={() => switchMode("login")}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  mode === "login"
                    ? "bg-white text-primary shadow-md"
                    : "text-medical-text-light hover:text-medical-text"
                }`}
                aria-current={mode === "login" ? "page" : undefined}
              >
                Login
              </button>
              <button
                onClick={() => switchMode("signup")}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  mode === "signup"
                    ? "bg-white text-primary shadow-md"
                    : "text-medical-text-light hover:text-medical-text"
                }`}
                aria-current={mode === "signup" ? "page" : undefined}
              >
                Sign Up
              </button>
            </nav>
          )}

          {step === "credentials" ? (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                requestOtp();
              }}
              aria-label={mode === "signup" ? "Sign up form" : "Login form"}
            >
              {mode === "signup" && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                  <div className="space-y-1.5">
                    <label htmlFor="full-name" className="medical-label">
                      Legal Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      className="medical-input !py-4 focus:ring-primary"
                      required
                      aria-required="true"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label id="role-label" className="medical-label">
                      Professional Role
                    </label>
                    <div
                      className="grid grid-cols-2 gap-4"
                      role="radiogroup"
                      aria-labelledby="role-label"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={form.role === "patient"}
                        onClick={() => updateForm("role", "patient")}
                        className={`py-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          form.role === "patient"
                            ? "border-primary bg-primary/5 text-primary shadow-inner"
                            : "border-slate-100 bg-white text-medical-text-light hover:border-slate-200"
                        }`}
                      >
                        Patient
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={form.role === "doctor"}
                        onClick={() => updateForm("role", "doctor")}
                        className={`py-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          form.role === "doctor"
                            ? "border-primary bg-primary/5 text-primary shadow-inner"
                            : "border-slate-100 bg-white text-medical-text-light hover:border-slate-200"
                        }`}
                      >
                        Clinician
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="medical-label">
                  Clinical Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@clinic.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="medical-input !py-4 focus:ring-primary"
                  required
                  aria-required="true"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="medical-label">
                  Access Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className="medical-input !py-4 focus:ring-primary"
                  required
                  aria-required="true"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
              </div>

              {mode === "login" && (
                <div className="flex justify-end text-sm font-bold">
                  <button
                    type="button"
                    onClick={() => navigate(PATH_PAGE.forgotPassword)}
                    className="text-primary hover:text-secondary focus:outline-none focus:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-5 !text-base disabled:opacity-50 shadow-xl shadow-primary/20 focus-visible:ring-offset-2"
                aria-live="polite"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Initializing Access...
                  </span>
                ) : (
                  "Continue to Verification"
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-10 animate-in zoom-in-95 duration-500">
              <div role="group" aria-label="6-digit verification code">
                <OtpInput otp={otp} setOtp={setOtp} />
              </div>

              <div className="space-y-6">
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="btn-primary w-full !py-5 !text-base disabled:opacity-50 shadow-xl shadow-primary/20 focus-visible:ring-offset-2"
                  aria-live="polite"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      Securing Session...
                    </span>
                  ) : (
                    "Complete Secure Login"
                  )}
                </button>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleResend}
                    disabled={loading || resendTimer > 0}
                    className="w-full py-4 rounded-2xl border border-slate-100 text-sm font-black text-primary hover:bg-primary/5 disabled:opacity-50 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary outline-none"
                    aria-live="polite"
                  >
                    {resendTimer > 0 ? (
                      <span className="text-medical-text-light flex items-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Resend Code in {resendTimer}s
                      </span>
                    ) : (
                      "Dispatch New Code"
                    )}
                  </button>
                  <button
                    onClick={() => setStep("credentials")}
                    className="text-xs font-black text-medical-text-light hover:text-secondary uppercase tracking-widest text-center transition-colors focus:outline-none focus:underline"
                  >
                    Modify Access Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {(error || message) && (
            <div
              className={`mt-8 p-4 rounded-2xl border font-bold text-sm flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                error
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}
              role="alert"
            >
              {error ? (
                <svg
                  className="w-5 h-5 shrink-0"
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
              ) : (
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <span className="sr-only">{error ? "Error:" : "Success:"}</span>
              {error || message}
            </div>
          )}
        </div>

        <p
          className="mt-10 text-center text-xs text-medical-text-light font-bold max-w-xs mx-auto leading-relaxed opacity-60 uppercase tracking-tighter"
          aria-hidden="true"
        >
          Encrypted Session Active • ISO 27001 Certified •{" "}
          <span className="text-secondary hover:underline cursor-pointer">
            Legal Disclosure
          </span>
        </p>
      </div>
    </main>
  );
}
