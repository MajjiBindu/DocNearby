import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import DoctorFilters from "../components/doctor/DoctorFilters.jsx";
import DoctorCard from "../components/doctor/DoctorCard.jsx";
import SEO from "../components/common/SEO.jsx";
import { useLocation } from "../hooks/useLocation.js";
import { useSearch } from "../hooks/useSearch.js";
import { searchApi } from "../services/api.js";

export default function Search() {
  const {
    coords,
    setCoords,
    city,
    setCity,
    radius,
    setRadius,
    setIsManual,
    getBrowserLocation,
  } = useLocation();
  
  const [sp] = useSearchParams();
  const {
    query,
    setQuery,
    suggestions,
    trending,
    recent,
    loadingSuggestions,
    addRecentSearch,
    clearRecent,
  } = useSearch();

  const [filters, setFilters] = useState(() => ({
    specialty: sp.get("specialty") || "",
    language: "",
    maxFee: "",
    sort: "rating_desc",
  }));
  
  const [showFilters, setShowFilters] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const resultGrid = useMemo(() => (
    <div
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="list"
      aria-label="Clinician search results"
    >
      {results.map((d) => (
        <DoctorCard key={d._id} doctor={d} />
      ))}
    </div>
  ), [results]);

  // Sync specialty from URL
  useEffect(() => {
    const s = sp.get("specialty");
    if (s) {
      setFilters(prev => ({ ...prev, specialty: s }));
      setQuery(s);
    }
  }, [sp, setQuery]);

  // Execute global search
  const executeSearch = useCallback(async (overrideParams = {}) => {
    // Defer loading state to avoid cascading render warning
    Promise.resolve().then(() => setLoadingResults(true));
    try {
      const p = {
        q: query,
        specialty: filters.specialty,
        language: filters.language,
        maxFee: filters.maxFee,
        sort: filters.sort,
        lat: coords?.lat,
        lng: coords?.lng,
        radius,
        ...overrideParams
      };
      const res = await searchApi.global(p);
      if (res.success) {
        setResults(res.data.doctors || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoadingResults(false);
      setShowSuggestions(false);
    }
  }, [query, filters, coords, radius]);

  // Run search when filters or coordinates change
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Handle outside click for suggestions
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSuggestionClick = (s) => {
    setQuery(s.text);
    addRecentSearch(s);
    const nextFilters = { ...filters };
    if (s.type === "specialty") nextFilters.specialty = s.payload.specialty;
    setFilters(nextFilters);
    setShowSuggestions(false);
  };

  const handleGeocode = async (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`,
      );
      const data = await res.json();
      if (data && data[0]) {
        setCoords({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
        const displayName = data[0].display_name || locationInput;
        const shortName = displayName.split(",")[0];
        setCity(shortName);
        setIsManual(true);
      }
    } catch (err) {
      console.error("Geocoding error", err);
    } finally {
      setGeocoding(false);
    }
  };

  const LocationControls = (
    <div className="space-y-6 mb-6 pb-6 border-b border-slate-100" role="group" aria-labelledby="location-controls-title">
      <h3 id="location-controls-title" className="sr-only">Location Controls</h3>
      <div>
        <label htmlFor="location-search" className="medical-label">Change Location</label>
        <form onSubmit={handleGeocode} className="relative">
          <input
            id="location-search"
            type="text"
            placeholder="City or area..."
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="medical-input !py-2.5 !pr-10 !text-sm focus:ring-primary"
            aria-label="Search for a city or area"
          />
          <button
            type="submit"
            disabled={geocoding}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text-light hover:text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Submit location search"
          >
            {geocoding ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" /> : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>
        <button
          onClick={() => getBrowserLocation()}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors focus:outline-none focus:underline"
          aria-label="Use my current device location"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Detect My Location
        </button>
      </div>

      <div>
        <label htmlFor="radius-select" className="medical-label">Search Radius</label>
        <div className="relative">
          <select
            id="radius-select"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="medical-input !py-2.5 !text-sm appearance-none cursor-pointer focus:ring-primary pr-10"
            aria-label="Select search radius"
          >
            <option value={1000}>Within 1 km</option>
            <option value={5000}>Within 5 km</option>
            <option value={10000}>Within 10 km</option>
            <option value={25000}>Within 25 km</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-medical-text-light" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="bg-medical-grey min-h-screen pb-20 pt-6 sm:pt-10" id="main-content">
      <SEO 
        title={`Search Doctors in ${city || 'your area'}`}
        description="Search for top-rated doctors, clinical specialists, and independent clinics. Filter by specialty, language, and consultation fees."
        keywords="find a doctor, medical specialist search, clinic directory, doctor ratings, healthcare search"
      />

      <div className="section-container">
        {/* Unified Search Header */}
        <div className="relative z-50 mb-10" ref={searchRef}>
          <div className="relative group">
            <label htmlFor="main-search-input" className="sr-only">Search Doctors, Specialties, Clinics</label>
            <input
              id="main-search-input"
              type="text"
              placeholder="Search Doctors, Specialities, Clinics..."
              className="w-full h-16 md:h-20 bg-white border-2 border-slate-100 rounded-3xl px-8 pr-16 text-lg md:text-xl font-bold text-secondary placeholder:text-medical-text-light focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-xl shadow-slate-200/50 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={showSuggestions}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              {loadingSuggestions && <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />}
              <button 
                onClick={() => executeSearch()}
                className="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label="Run search"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              id="search-suggestions"
              className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
              role="listbox"
            >
              {query.length === 0 && (
                <div className="p-8 grid md:grid-cols-2 gap-8">
                  {recent.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-medical-text-light uppercase tracking-widest">Recent Searches</h3>
                        <button 
                          onClick={clearRecent} 
                          className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
                          aria-label="Clear all recent searches"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recent.map((r, i) => (
                          <button
                            key={i}
                            role="option"
                            onClick={() => handleSuggestionClick(r)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors focus:bg-slate-50 outline-none"
                          >
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-secondary">{r.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-black text-medical-text-light uppercase tracking-widest mb-4">Trending Specialties</h3>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Trending search terms">
                      {trending.map((t, i) => (
                        <button
                          key={i}
                          role="option"
                          onClick={() => handleSuggestionClick({ ...t, type: "specialty" })}
                          className="px-5 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-sm font-bold text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all focus:ring-2 focus:ring-primary outline-none"
                        >
                          {t.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {query.length > 0 && suggestions.length > 0 && (
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      role="option"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 text-left transition-colors group focus:bg-slate-50 outline-none"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        s.type === 'specialty' ? 'bg-primary/10 text-primary' : 
                        s.type === 'clinic' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`} aria-hidden="true">
                        {s.type === 'specialty' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        ) : s.type === 'clinic' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-secondary tracking-tight group-hover:text-primary transition-colors">{s.text}</h4>
                        {s.subtext && <p className="text-xs font-bold text-medical-text-light uppercase tracking-wider">{s.subtext}</p>}
                      </div>
                      <span className="text-[10px] font-black text-medical-text-light bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">{s.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block medical-card p-6 h-fit sticky top-24" aria-labelledby="filter-sidebar-title">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 id="filter-sidebar-title" className="text-lg font-black text-secondary tracking-tight">Refine Results</h2>
            </div>
            {LocationControls}
            <DoctorFilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* Mobile Filters UI */}
          <div className="lg:hidden flex flex-col gap-4" aria-label="Mobile filters">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full btn-secondary !py-4 flex items-center justify-center gap-2 focus:ring-offset-2"
              aria-expanded={showFilters}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Sort & Filter Results"}
            </button>
            {showFilters && (
              <div className="medical-card p-6 animate-in slide-in-from-top-2 duration-300">
                {LocationControls}
                <DoctorFilters filters={filters} setFilters={setFilters} />
              </div>
            )}
          </div>

          <section className="space-y-6" aria-labelledby="results-title">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 id="results-title" className="text-2xl font-black text-secondary tracking-tight">
                  Matched Clinical Experts
                </h2>
                <p className="text-medical-text-light font-medium mt-1">
                  Showing results for <span className="font-bold text-secondary">{query || filters.specialty || "General Search"}</span> in <span className="font-bold text-secondary">{city || "your location"}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm font-bold text-medical-text-light" aria-live="polite">
                  {results.length} clinicians found
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-[10px] font-black text-medical-text-light uppercase tracking-widest shrink-0">Sort By</label>
                  <select 
                    id="sort-select"
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                    className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-secondary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer"
                  >
                    <option value="rating_desc">Highest Rated</option>
                    <option value="experience_desc">Most Experienced</option>
                    <option value="fee_asc">Fee: Low to High</option>
                    <option value="fee_desc">Fee: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {loadingResults && results.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 medical-card animate-pulse" aria-busy="true">
                <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" aria-hidden="true" />
                <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">Accessing clinical database</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 medical-card p-12 text-center" role="alert">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300" aria-hidden="true">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="max-w-xs">
                  <h3 className="text-xl font-black text-secondary">No exact matches found</h3>
                  <p className="mt-2 text-medical-text-light font-medium">Try broadening your search criteria or checking another clinical area.</p>
                </div>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilters({ specialty: "", language: "", maxFee: "", sort: "rating_desc" });
                  }}
                  className="btn-secondary !px-8 focus:ring-offset-2"
                  aria-label="Reset all filters and start over"
                >
                  Reset All Parameters
                </button>
              </div>
            ) : (
              resultGrid
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
