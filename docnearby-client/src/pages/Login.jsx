import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../components/auth/OtpInput.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "patient",
};

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = useMemo(() => form.email.trim().toLowerCase(), [form.email]);
  const otpPurpose = mode === "signup" ? "signup" : "login";

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
        setMessage(res.message || "OTP sent to your email.");
      } else {
        setError(res?.message || "Unable to send OTP.");
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
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
        navigate(nextUser?.role === "doctor" ? "/doctor" : "/patient", {
          replace: true,
        });
      } else {
        setError(res?.message || "Invalid OTP.");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.resendOtp({ email, purpose: otpPurpose });
      setMessage(res?.message || "OTP resent to your email.");
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Unable to resend OTP.",
      );
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
  };

  return (
    <div className="min-h-screen bg-medical-grey flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-primary/20 mb-4">
            D
          </div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">DocNearby</h2>
          <p className="text-medical-text-light font-medium text-sm">Empowering Local Healthcare</p>
        </div>

        <div className="medical-card p-8 md:p-10 !shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-secondary tracking-tight">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-sm font-medium text-medical-text-light">
              {step === "otp"
                ? `Enter the verification code sent to ${email}`
                : "Secure access to your healthcare dashboard"}
            </p>
          </div>

          {step === "credentials" && (
            <div className="mb-8 flex p-1 bg-slate-50 rounded-xl border border-slate-100">
              <button
                onClick={() => switchMode("login")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  mode === "login" ? "bg-white text-primary shadow-sm" : "text-medical-text-light hover:text-medical-text"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  mode === "signup" ? "bg-white text-primary shadow-sm" : "text-medical-text-light hover:text-medical-text"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {step === "credentials" ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                requestOtp();
              }}
            >
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="medical-label">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      className="medical-input"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="medical-label">I am a</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateForm("role", "patient")}
                        className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.role === "patient" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-white text-medical-text-light hover:border-slate-200"
                        }`}
                      >
                        Patient
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm("role", "doctor")}
                        className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.role === "doctor" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-white text-medical-text-light hover:border-slate-200"
                        }`}
                      >
                        Doctor
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="medical-label">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="medical-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="medical-label">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className="medical-input"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full !py-3.5 !text-base disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending OTP...
                  </span>
                ) : (
                  "Continue to Verify"
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <OtpInput otp={otp} setOtp={setOtp} />
              
              <div className="space-y-4">
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="btn-primary w-full !py-3.5 !text-base disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Secure Login"}
                </button>
                
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                  <button
                    onClick={() => setStep("credentials")}
                    className="text-sm font-bold text-medical-text-light hover:text-medical-text"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2 animate-in shake-in duration-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {message && (
            <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-medical-text-light font-medium max-w-xs mx-auto">
          By continuing, you agree to our <span className="text-secondary font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-secondary font-bold hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
