import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import { SPECIALTIES } from "../utils/constants.js";
import { useLocation } from "../hooks/useLocation.js";
import { symptomApi } from "../services/api.js";
import translations from "../utils/i18n.js";

export default function Home() {
  const navigate = useNavigate();
  const { city, setCity, coords, getBrowserLocation } = useLocation();

  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [symptoms, setSymptoms] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem("dn_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  const handleSearchDoctors = () => {
    navigate("/search");
  };

  const handleSuggest = async () => {
    if (!symptoms.trim()) {
      setError("Please describe your symptoms first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await symptomApi.suggest(symptoms);
      setSuggestions(res?.data?.specialties || []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to get suggestions",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-10">
      <div className="mx-auto max-w-6xl px-4 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-blue-popsicle to-purple-shadow p-8 md:p-12 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed font-medium">
              Book appointments with independent doctors and smaller clinics in
              your city. Experience healthcare without the middleman.
            </p>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Input
                  label={
                    <span className="text-white/60 font-semibold">
                      {t.city || "Your city"}
                    </span>
                  }
                  placeholder="e.g. Warangal, Hubballi, Ujjain"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-2xl w-full bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:bg-white/10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="w-full lg:w-auto h-[52px] px-6 rounded-2xl bg-redline text-white border-redline hover:bg-redline/80 transition-all active:scale-95 border-2 shadow-lg shadow-redline/20"
                  onClick={async () => {
                    try {
                      await getBrowserLocation();
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-bold">{t.useLocation}</span>
                  </div>
                </Button>
              </div>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                {t.popularSpecialties}
              </p>
              <div className="flex flex-wrap gap-3">
                {SPECIALTIES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-redline hover:border-redline hover:shadow-lg hover:shadow-redline/20 active:scale-95"
                    onClick={() =>
                      navigate(`/search?specialty=${encodeURIComponent(s)}`)
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-white/10 pt-8">
              <p className="text-xs font-semibold text-white/40 text-center sm:text-left tracking-wide">
                {coords ? (
                  <span className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                    GPS Active: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
                  </span>
                ) : (
                  "Tip: GPS gives best nearby results."
                )}
              </p>
              <Button
                type="button"
                onClick={handleSearchDoctors}
                className="w-full sm:w-auto rounded-2xl !bg-redline text-white px-10 py-4 font-black text-lg hover:!bg-redline/80 shadow-2xl shadow-redline/30 transition-all active:scale-95 border-none"
              >
                {t.searchBtn}
              </Button>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-10 md:-right-20 -top-10 md:-top-20 h-48 md:h-96 w-48 md:w-96 rounded-full bg-redline/10 opacity-40 blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-popsicle/20 opacity-30 blur-3xl"></div>
        </section>

        {/* Symptom Checker Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-purple-shadow shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-blue-popsicle px-8 py-8 md:py-10">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t.notSure}
            </h2>
            <p className="mt-2 text-base text-white/60 font-medium">
              {t.describeSymptoms}
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="relative group">
                <textarea
                  className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 p-6 md:p-8 text-lg text-white transition-all focus:ring-8 focus:ring-blue-popsicle/20 focus:border-blue-popsicle/50 outline-none placeholder:text-white/20 resize-none shadow-inner"
                  rows={4}
                  placeholder={t.symptomPlaceholder}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/40 shadow-sm opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Button
                  type="button"
                  onClick={handleSuggest}
                  disabled={loading}
                  className="w-full sm:flex-1 rounded-2xl !bg-redline text-white px-10 h-14 font-black text-lg hover:!bg-redline/80 shadow-2xl shadow-redline/30 transition-all active:scale-95 border-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      <span>{t.loading || "Finding..."}</span>
                    </div>
                  ) : (
                    <span>{t.findSpecialist}</span>
                  )}
                </Button>

                {error && (
                  <div className="flex items-center gap-2 text-sm font-bold text-red-500 animate-in shake-in duration-300">
                    <svg
                      className="h-4 w-4"
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
                    {error}
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10 animate-in zoom-in-95 duration-500">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6">
                    {t.weSuggest}
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((s) => (
                      <div
                        key={s}
                        className="flex flex-col justify-between p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl transition-all group"
                      >
                        <div>
                          <h3 className="text-xl font-black text-white">
                            {s}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-redline px-5 py-3 text-sm font-bold text-white transition-all hover:bg-redline/80 active:scale-95 shadow-lg shadow-redline/20"
                          onClick={() =>
                            navigate(
                              `/search?specialty=${encodeURIComponent(s)}`,
                            )
                          }
                        >
                          Find Doctors
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
