import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../components/auth/OtpInput.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
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
    <div className="min-h-screen bg-purple-shadow flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
        <div className="mb-6 md:mb-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            {mode === "signup" ? "Create your account" : "Login"}
          </h1>
          <p className="mt-2 md:mt-1 text-sm md:text-base text-slate-600">
            {step === "otp"
              ? `We sent a verification code to ${email}.`
              : "Use email, password, and email OTP verification."}
          </p>
        </div>

        <div className="mb-6 md:mb-5 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
            disabled={loading}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
            disabled={loading}
          >
            Sign up
          </button>
        </div>

        {step === "credentials" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              requestOtp();
            }}
          >
            {mode === "signup" ? (
              <>
                <Input
                  label="Full name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  autoComplete="name"
                />
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">
                    Role
                  </span>
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={form.role}
                    onChange={(e) => updateForm("role", e.target.value)}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </label>
              </>
            ) : null}

            <Input
              label="Email"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Password"
              placeholder="At least 8 characters"
              type="password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
            <Button type="submit" disabled={loading} className="w-full !bg-redline !text-white hover:!bg-redline/80 font-bold border-none h-12 rounded-xl shadow-lg shadow-redline/20 transition-all active:scale-95">
              {loading ? "Sending..." : "Send email OTP"}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <OtpInput otp={otp} setOtp={setOtp} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={verifyOtp}
                disabled={loading}
                className="flex-1 h-11 md:h-12"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resendOtp}
                disabled={loading}
                className="h-11 md:h-12"
              >
                Resend
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep("credentials");
                  setOtp("");
                  setMessage("");
                  setError("");
                }}
                disabled={loading}
                className="h-11 md:h-12"
              >
                Edit
              </Button>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-4 text-sm text-slate-700">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
