import React, { useEffect, useState } from "react";
import { labApi } from "../services/api.js";
import { useLocation } from "../hooks/useLocation.js";
import Spinner from "../components/common/Spinner.jsx";

export default function NearbyLabs() {
  const {
    coords,
    setCoords,
    radius,
    setRadius,
    setIsManual,
    getBrowserLocation,
  } = useLocation();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [lastSearched, setLastSearched] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  const fetchLabs = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await labApi.list(params);
      // Handle response shape: { labs: [...] }
      const list = Array.isArray(data) ? data : data?.labs || [];
      setLabs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch labs", err);
      setError("Failed to load labs. Please try again later.");
      setLabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const baseParams = coords
      ? { lat: coords.lat, lng: coords.lng, radius }
      : {};
    fetchLabs({ ...baseParams, testName: lastSearched });
  }, [coords, radius]);

  const handleUseMyLocation = async () => {
    if (loading) return;
    try {
      setFetchingLocation(true);
      const location = await getBrowserLocation();
      await fetchLabs({ lat: location.lat, lng: location.lng, radius });
      setSearch("");
      setLastSearched("");
    } catch (err) {
      console.error("Browser location error", err);
      setError("Could not access your location.");
    } finally {
      setFetchingLocation(false);
    }
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
        const next = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setCoords(next);
        setIsManual(true);
        await fetchLabs({ ...next, radius, testName: lastSearched });
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
      alert("Failed to search location.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedSearch = search.trim();
    if (trimmedSearch === lastSearched) return;

    const base = coords ? { lat: coords.lat, lng: coords.lng, radius } : {};
    setLastSearched(trimmedSearch);
    await fetchLabs({ ...base, testName: trimmedSearch });
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-8">
      <div className="mx-auto max-w-6xl px-4 space-y-10">
        <header className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Nearby Diagnostic Labs
          </h1>
          <p className="text-white/40 mt-2 text-lg font-medium">
            Find premium diagnostic services and healthcare checkups near you.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 bg-purple-shadow rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-6">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              Location & Radius
            </label>
            <div className="flex gap-4">
              <form onSubmit={handleGeocode} className="flex-1 relative">
                <input
                  type="text"
                  placeholder="City or area..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-8 focus:ring-blue-popsicle/20 focus:border-blue-popsicle/50 transition-all text-base font-bold shadow-inner"
                />
                <button
                  type="submit"
                  disabled={geocoding}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-redline disabled:opacity-50 transition-colors"
                >
                  {geocoding ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-redline border-t-transparent"></div>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                </button>
              </form>
              <button
                onClick={handleUseMyLocation}
                className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-redline hover:text-white hover:border-redline transition-all text-white/60 active:scale-95 shadow-inner"
                title="Use my location"
              >
                <svg
                  className="h-6 w-6"
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
              </button>
            </div>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base font-bold text-white focus:outline-none focus:ring-8 focus:ring-blue-popsicle/20 focus:border-blue-popsicle/50 transition-all appearance-none cursor-pointer shadow-inner"
            >
              <option value={1000} className="bg-purple-shadow">1 km radius</option>
              <option value={5000} className="bg-purple-shadow">5 km radius</option>
              <option value={10000} className="bg-purple-shadow">10 km radius</option>
              <option value={25000} className="bg-purple-shadow">25 km radius</option>
            </select>
          </div>

          <div className="space-y-6">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
              Search Tests
            </label>
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
                placeholder="CBC, MRI, Blood Test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-8 focus:ring-blue-popsicle/20 focus:border-blue-popsicle/50 transition-all text-base font-bold shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-redline transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      {fetchingLocation && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm font-medium text-indigo-700">
          Fetching your location...
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12 text-redline" />
        </div>
      ) : !Array.isArray(labs) || labs.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 animate-in fade-in duration-700">
          <div className="rounded-full bg-white/5 p-6 w-fit mx-auto mb-6 text-white/20">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.34a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 00-.586 1.414l.05.05a2 2 0 001.414.586h16.356a2 2 0 001.414-.586l.05-.05a2 2 0 00-.586-1.414l-1.168-1.168z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11V3m0 0l-3 3m3-3l3 3" />
            </svg>
          </div>
          <p className="text-2xl font-black text-white">No labs found near you</p>
          {search && (
            <p className="text-white/40 mt-2 font-medium">
              Try expanding your radius or refining your test search.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-10">
          {labs.map((lab) => (
            <div
              key={lab.id || lab._id}
              className="group relative bg-white border border-grey-blue-leaf/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-grey-blue-leaf/5 hover:-translate-y-2 hover:shadow-grey-blue-leaf/10 transition-all duration-500 overflow-hidden"
            >
              {/* Top border accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-popsicle to-purple-shadow" />
              
              <div className="flex justify-between items-start gap-6 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-3xl font-black text-blue-popsicle tracking-tight">
                      {lab.name}
                    </h2>
                    {lab.rating && (
                      <span className="inline-flex items-center gap-1.5 bg-redline/5 text-redline text-sm font-black px-4 py-1.5 rounded-xl border border-redline/10">
                         ⭐ {lab.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mt-3">{lab.city}</p>
                </div>
                {lab.distanceInKm !== undefined && (
                  <span className="text-sm font-black text-blue-popsicle bg-blue-popsicle/5 px-4 py-2 rounded-2xl border border-blue-popsicle/10">
                    {lab.distanceInKm.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 text-base font-bold text-grey-blue-leaf relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-grey-blue-leaf/50">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span>
                    {lab.openTime} – {lab.closeTime}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-grey-blue-leaf/50">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <a
                    href={`tel:${lab.phone}`}
                    className="hover:text-redline transition-colors"
                  >
                    {lab.phone}
                  </a>
                </div>
              </div>

              <div className="mt-10 relative z-10">
                <h3 className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.3em] mb-6">
                  Available Tests
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {lab.tests &&
                    lab.tests.map((test) => (
                      <div
                        key={test.id || test._id}
                        className="flex justify-between items-center p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-grey-blue-leaf/5 transition-all group/test"
                      >
                        <div className="flex flex-col">
                          <span className="text-base font-black text-blue-popsicle tracking-tight">
                            {test.name}
                          </span>
                          {test.homeCollection && (
                            <span className="mt-1.5 inline-flex w-fit items-center text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-100 uppercase tracking-widest">
                              Home collection
                            </span>
                          )}
                        </div>
                        <span className="text-xl font-black text-redline">
                          ₹{test.price}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
