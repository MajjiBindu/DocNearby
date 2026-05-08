import React, { useEffect, useState } from "react";
import { labApi } from "../services/api.js";
import { useLocation } from "../hooks/useLocation.js";
import Spinner from "../components/common/Spinner.jsx";

export default function NearbyLabs() {
  const { coords, useBrowserLocation } = useLocation();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [lastSearched, setLastSearched] = useState("");

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
    if (coords) return;

    let cancelled = false;

    async function detectLocation() {
      setFetchingLocation(true);
      try {
        await useBrowserLocation({ timeout: 8000 });
      } catch {
        // Silent fallback to the unfiltered initial load.
      } finally {
        if (!cancelled) setFetchingLocation(false);
      }
    }

    detectLocation();
    return () => {
      cancelled = true;
    };
  }, [coords, useBrowserLocation]);

  useEffect(() => {
    const baseParams = coords
      ? { lat: coords.lat, lng: coords.lng, radius: 5000 }
      : {};
    fetchLabs(baseParams);
    setLastSearched("");
  }, [coords]);

  const handleUseMyLocation = async () => {
    if (loading) return;
    try {
      const location = await useBrowserLocation();
      await fetchLabs({ lat: location.lat, lng: location.lng, radius: 5000 });
      setSearch("");
      setLastSearched("");
    } catch (err) {
      console.error("Browser location error", err);
      setError("Could not access your location.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedSearch = search.trim();

    // Avoid duplicate fetches on empty or same submit
    if (trimmedSearch === lastSearched) return;

    const base = coords
      ? { lat: coords.lat, lng: coords.lng, radius: 5000 }
      : {};
    setLastSearched(trimmedSearch);
    await fetchLabs({ ...base, testName: trimmedSearch });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Nearby Diagnostic Labs
        </h1>
        <p className="text-slate-600 mt-1">
          Find labs for blood tests, scans, and health checkups.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
        <button
          onClick={handleUseMyLocation}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium whitespace-nowrap"
        >
          Use my location
        </button>
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by test name (e.g. CBC, MRI)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            </button>
          </div>
        </form>
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
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !Array.isArray(labs) || labs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-600">No labs found near you.</p>
          {search && (
            <p className="text-sm text-slate-500 mt-1">
              Try clearing your search or expanding the radius.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {labs.map((lab) => (
            <div
              key={lab.id || lab._id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">
                      {lab.name}
                    </h2>
                    {lab.rating && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded border border-amber-100">
                        ⭐ {lab.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{lab.city}</p>
                </div>
                {lab.distanceInKm !== undefined && (
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                    {lab.distanceInKm.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {lab.openTime} – {lab.closeTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${lab.phone}`}
                    className="hover:text-slate-900 transition-colors"
                  >
                    {lab.phone}
                  </a>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Available Tests
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lab.tests &&
                    lab.tests.map((test) => (
                      <div
                        key={test.id || test._id}
                        className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {test.name}
                          </span>
                          {test.homeCollection && (
                            <span className="mt-0.5 inline-flex w-fit items-center text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tight">
                              Home collection
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-900">
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
  );
}
