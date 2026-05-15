import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DoctorFilters from "../components/doctor/DoctorFilters.jsx";
import DoctorCard from "../components/doctor/DoctorCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import { useLocation } from "../hooks/useLocation.js";
import { useDoctors } from "../hooks/useDoctors.js";

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
  const [filters, setFilters] = useState(() => ({
    specialty: sp.get("specialty") || "",
    language: "",
    maxFee: "",
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  const params = useMemo(() => {
    const p = {};
    if (coords?.lat && coords?.lng) {
      Object.assign(p, { lat: coords.lat, lng: coords.lng, radius });
    }
    if (filters.specialty) p.specialty = filters.specialty;
    if (filters.language) p.language = filters.language;
    if (filters.maxFee) p.maxFee = Number(filters.maxFee);
    return p;
  }, [coords, filters, radius]);

  const { loading, error, doctors } = useDoctors(params);

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
      } else {
        alert("Location not found. Please try a different search.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
      alert("Failed to search location. Please try again.");
    } finally {
      setGeocoding(false);
    }
  };

  const LocationControls = (
    <div className="space-y-6 mb-6 pb-6 border-b border-slate-100">
      <div>
        <label className="medical-label">Change Location</label>
        <form onSubmit={handleGeocode} className="relative">
          <input
            type="text"
            placeholder="City or area..."
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="medical-input !py-2.5 !pr-10 !text-sm"
          />
          <button
            type="submit"
            disabled={geocoding}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text-light hover:text-primary transition-colors disabled:opacity-50"
          >
            {geocoding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>
        <button
          onClick={() => getBrowserLocation()}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Detect My Location
        </button>
      </div>

      <div>
        <label className="medical-label">Search Radius</label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="medical-input !py-2.5 !text-sm appearance-none cursor-pointer"
        >
          <option value={1000}>Within 1 km</option>
          <option value={5000}>Within 5 km</option>
          <option value={10000}>Within 10 km</option>
          <option value={25000}>Within 25 km</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-medical-grey min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-container">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block medical-card p-6 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-lg font-black text-secondary tracking-tight">Refine Search</h2>
            </div>
            {LocationControls}
            <DoctorFilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* Mobile Filters Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full mb-6 btn-secondary !py-4 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter Specialists"}
            </button>

            {/* Mobile Filters Drawer */}
            {showFilters && (
              <div className="mb-8 medical-card p-6 animate-in slide-in-from-top-2 duration-300">
                {LocationControls}
                <DoctorFilters filters={filters} setFilters={setFilters} />
              </div>
            )}
          </div>

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-secondary tracking-tight">
                  Independent Specialists
                </h1>
                <p className="text-medical-text-light font-medium mt-1">
                  Showing available doctors in {city || "your area"}
                </p>
              </div>
              {!loading && (
                <div className="text-sm font-bold text-medical-text-light">
                  {doctors.length} results found
                </div>
              )}
            </div>

            {coords ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-700">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Showing clinics within {radius / 1000}km of {city || "your location"}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 text-sm font-bold text-primary">
                📍 Enable location for nearby results
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold">
                {error}
              </div>
            )}

            {loading && doctors.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 medical-card bg-white/50 animate-in fade-in duration-500">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-bold text-medical-text-light">Searching specialists...</p>
              </div>
            ) : !loading && doctors.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 medical-card p-12 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="max-w-xs">
                  <h3 className="text-xl font-extrabold text-secondary tracking-tight">No doctors found</h3>
                  <p className="mt-2 text-medical-text-light">Try widening your search radius or adjusting your filters.</p>
                </div>
                <button
                  onClick={() => setFilters({ specialty: "", language: "", maxFee: "" })}
                  className="btn-secondary text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {doctors.map((d) => (
                  <DoctorCard key={d._id} doctor={d} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
