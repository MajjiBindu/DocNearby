import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO.jsx";
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
    <main className="bg-medical-grey min-h-screen pb-20 pt-8 sm:pt-12" id="main-content">
      <SEO 
        title="Find Top Doctors & Clinics Near You"
        description="DocNearby connects you with verified independent doctors and local clinics. Book appointments instantly and find specialists based on your symptoms."
        keywords="doctor booking, medical clinics near me, find a doctor, health symptoms checker, clinical laboratory"
      />
      
      <div className="section-container space-y-16">
        {/* Hero Section */}
        <section className="relative grid lg:grid-cols-2 gap-12 items-center" aria-labelledby="hero-heading">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm" role="status">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Empowering Independent Clinics
            </div>
            
            <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary leading-[1.1] tracking-tight">
              {t.tagline}
            </h1>
            <p className="text-lg md:text-xl text-medical-text-light leading-relaxed max-w-xl">
              DocNearby connects you directly with independent doctors and local clinics. 
              Transparent healthcare without the corporate middleman.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleSearchDoctors}
                className="btn-primary !px-10 !py-4 text-lg focus-visible:ring-offset-2"
                aria-label="Search for doctors near you"
              >
                {t.searchBtn}
              </button>
              <button 
                onClick={() => navigate('/labs')}
                className="btn-secondary !px-10 !py-4 text-lg focus-visible:ring-offset-2"
                aria-label="Find clinical laboratories near you"
              >
                Find Labs Near Me
              </button>
            </div>

            <nav className="pt-6" aria-labelledby="specialties-heading">
              <p id="specialties-heading" className="text-xs font-bold text-medical-text-light uppercase tracking-widest mb-4">
                {t.popularSpecialties}
              </p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-medical-text hover:border-primary hover:text-primary transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-700" aria-hidden="true">
            <div className="medical-card p-2">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <img 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop" 
                  alt="Modern medical clinic environment" 
                  className="object-cover w-full h-full"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent"></div>
              </div>
              
              {/* Floating UI Elements */}
              <div className="absolute -left-6 top-1/4 medical-card !rounded-2xl p-4 flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-medical-text-light">Doctors Verified</p>
                  <p className="text-sm font-black text-secondary">100% Secure</p>
                </div>
              </div>

              <div className="absolute -right-6 bottom-1/4 medical-card !rounded-2xl p-4 flex items-center gap-4 animate-bounce-slow delay-500">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-medical-text-light">Instant Booking</p>
                  <p className="text-sm font-black text-secondary">24/7 Access</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Location Bar */}
        <section className="medical-card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700" aria-label="Location and search filters">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="city-input" className="medical-label">{t.city || "Search City"}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-text-light" aria-hidden="true">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </span>
                  <input 
                    id="city-input"
                    type="text"
                    placeholder="e.g. Hyderabad, Warangal"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="medical-input !pl-11 focus:ring-primary"
                    aria-describedby="city-help"
                  />
                  <span id="city-help" className="sr-only">Enter the city name to find doctors nearby</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="medical-label">GPS Precision</label>
                <button 
                  onClick={getBrowserLocation}
                  className="btn-secondary w-full flex items-center justify-center gap-3 h-[52px] focus-visible:ring-offset-2"
                  aria-label="Use my current GPS location"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.useLocation}
                </button>
              </div>
            </div>
            <button 
              onClick={handleSearchDoctors}
              className="btn-primary !h-[52px] !px-12 text-lg focus-visible:ring-offset-2"
            >
              {t.searchBtn}
            </button>
          </div>
        </section>

        {/* Symptom Checker Section */}
        <section className="grid lg:grid-cols-[1fr_1.5fr] gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200" aria-labelledby="symptom-checker-heading">
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20" aria-hidden="true">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 id="symptom-checker-heading" className="text-3xl font-extrabold text-secondary tracking-tight">
              {t.notSure}
            </h2>
            <p className="text-medical-text-light text-lg">
              Describe your symptoms and our system will suggest the right specialist for you.
            </p>
          </div>

          <div className="medical-card p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="symptoms-input" className="sr-only">Describe your symptoms</label>
              <textarea
                id="symptoms-input"
                className="medical-input min-h-[160px] resize-none text-lg focus:ring-primary"
                placeholder={t.symptomPlaceholder}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                aria-required="true"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={handleSuggest}
                disabled={loading}
                className="btn-primary !px-10 !h-14 !text-lg w-full sm:w-auto disabled:opacity-50 focus-visible:ring-offset-2"
                aria-live="polite"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span>
                    Analyzing...
                  </span>
                ) : t.findSpecialist}
              </button>

              {error && (
                <p className="text-red-500 font-semibold flex items-center gap-2" role="alert">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="pt-8 border-t border-slate-100 animate-in zoom-in-95 duration-500" aria-live="polite">
                <p className="text-xs font-bold text-medical-text-light uppercase tracking-widest mb-6">
                  {t.weSuggest}
                </p>
                <div className="grid sm:grid-cols-2 gap-4" role="list">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      role="listitem"
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between group hover:border-primary transition-all"
                    >
                      <span className="font-bold text-secondary">{s}</span>
                      <button
                        onClick={() => navigate(`/search?specialty=${encodeURIComponent(s)}`)}
                        className="text-primary font-bold text-sm hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary outline-none rounded p-1"
                        aria-label={`Find doctors for ${s}`}
                      >
                        Find Doctors
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
