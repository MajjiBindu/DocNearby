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
        // Use a shorter name if available
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
    <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
      <div>
        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
          Location
        </label>
        <form onSubmit={handleGeocode} className="relative">
          <input
            type="text"
            placeholder="City or area..."
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-popsicle/50 transition-all"
          />
          <button
            type="submit"
            disabled={geocoding}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-redline transition-colors disabled:opacity-50"
          >
            {geocoding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            ) : (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </button>
        </form>
        <button
          onClick={() => getBrowserLocation()}
          className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-redline hover:text-redline/80 transition-colors"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Use Current Location
        </button>
      </div>

      <div>
        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
          Radius
        </label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-popsicle/50 transition-all appearance-none"
        >
          <option value={1000}>1 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
          <option value={25000}>25 km</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block rounded-[2rem] border border-white/10 bg-purple-shadow p-8 h-fit shadow-2xl shadow-black/20 sticky top-24">
            <h2 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Filters
            </h2>
            {LocationControls}
            <DoctorFilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* Mobile Filters Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full mb-6 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-purple-shadow px-4 py-4 text-sm font-bold text-white shadow-xl hover:bg-purple-shadow/90 transition-all"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Mobile Filters Drawer */}
            {showFilters && (
              <div className="mb-8 rounded-[2rem] border border-white/10 bg-purple-shadow p-8 shadow-2xl shadow-black/30 animate-in slide-in-from-top-2 duration-300">
                <h2 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Filters
                </h2>
                {LocationControls}
                <DoctorFilters filters={filters} setFilters={setFilters} />
              </div>
            )}
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Available Doctors
              </h1>
            </div>

            {coords ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Results within {radius / 1000}km of{" "}
                    <span className="font-black underline decoration-emerald-300 underline-offset-4">
                      {city || "your location"}
                    </span>
                  </span>
                </div>
                {city ? null : (
                  <span className="opacity-60">
                    {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">
                📍 Enable location for nearby results — showing all doctors
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading && doctors.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in duration-500">
                <Spinner className="h-10 w-10 text-indigo-600" />
                <p className="text-sm font-medium text-slate-500">
                  Searching for specialists near you...
                </p>
              </div>
            ) : !loading && doctors.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center p-8 animate-in fade-in duration-500">
                <div className="rounded-full bg-white/5 p-6">
                  <svg
                    className="h-12 w-12 text-white/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    No doctors found
                  </h3>
                  <p className="mt-2 text-sm text-white/40">
                    Try widening your search radius or adjusting your filters.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFilters({ specialty: "", language: "", maxFee: "" })
                  }
                  className="mt-4 text-sm font-bold text-redline hover:text-redline/80 underline-offset-8 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
