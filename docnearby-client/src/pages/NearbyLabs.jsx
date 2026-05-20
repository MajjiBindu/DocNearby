import { useEffect, useState } from "react";
import { labApi, searchApi } from "../services/api.js";
import { useLocation } from "../hooks/useLocation.js";
import SEO from "../components/common/SEO.jsx";

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
    setTimeout(() => {
      fetchLabs({ ...baseParams, testName: lastSearched });
    }, 0);
  }, [coords, radius, lastSearched]);

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
      const res = await searchApi.geocode(locationInput);
      const data = res.data;
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
    <main className="min-h-screen bg-medical-grey pb-20 pt-8 sm:pt-12" id="main-content">
      <SEO 
        title="Diagnostic Centers & Clinical Labs Near You"
        description="Find verified diagnostic centers and laboratories. Search for specific tests like MRI, CBC, and blood tests. Book lab appointments online."
        keywords="clinical labs, diagnostic centers, MRI near me, blood test, pathology labs, radiology centers"
      />
      
      <div className="mx-auto max-w-6xl px-4 space-y-10">
        <header className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">
            Diagnostic Network
          </h1>
          <p className="text-medical-text-light mt-2 text-lg font-medium max-w-2xl">
            Find certified diagnostic centers and professional healthcare labs near your current location.
          </p>
        </header>

        {/* Search Controls */}
        <section className="medical-card p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700" aria-label="Laboratory filters">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label htmlFor="location-input" className="medical-label mb-2 block">Location Filter</label>
                <div className="flex gap-3">
                  <form onSubmit={handleGeocode} className="flex-1 relative">
                    <input
                      id="location-input"
                      type="text"
                      placeholder="Enter city or area..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="medical-input !pl-11 !h-14 focus:ring-primary"
                      aria-label="Search labs by location"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-4.5 text-medical-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <button
                      type="submit"
                      disabled={geocoding}
                      className="absolute right-3 top-2.5 h-9 px-4 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-dark transition-all disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      aria-label="Search location"
                    >
                      {geocoding ? "..." : "Search"}
                    </button>
                  </form>
                  <button
                    onClick={handleUseMyLocation}
                    className="btn-secondary !h-14 !w-14 !p-0 flex items-center justify-center shrink-0 focus-visible:ring-offset-2"
                    title="Use my current GPS location"
                    aria-label="Use my current GPS location"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="radius-select" className="medical-label mb-2 block">Search Radius</label>
                <div className="relative">
                  <select
                    id="radius-select"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="medical-input !h-14 appearance-none cursor-pointer focus:ring-primary pr-10"
                    aria-label="Select search radius"
                  >
                    <option value={1000}>1 kilometer</option>
                    <option value={5000}>5 kilometers</option>
                    <option value={10000}>10 kilometers</option>
                    <option value={25000}>25 kilometers</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-medical-text-light" aria-hidden="true">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="test-search" className="medical-label mb-2 block">Find Specific Test</label>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    id="test-search"
                    type="text"
                    placeholder="CBC, MRI, Blood Test, etc..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="medical-input !pl-11 !h-14 focus:ring-primary"
                    aria-label="Search for specific clinical tests"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-4.5 text-medical-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <button
                    type="submit"
                    className="absolute right-3 top-2.5 h-9 px-4 bg-secondary text-white rounded-xl font-bold text-xs hover:bg-secondary-dark transition-all focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    aria-label="Filter labs by test name"
                  >
                    Filter
                  </button>
                </form>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-medical-text leading-relaxed">
                    Adjust the radius to expand your search. All listed labs are verified for quality standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold animate-in fade-in" role="alert">
            {error}
          </div>
        )}

        {fetchingLocation && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 text-primary rounded-xl text-sm font-bold animate-pulse" role="status">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true"></div>
            Detecting your current location...
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4" aria-busy="true">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" aria-hidden="true"></div>
            <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">Scanning diagnostic network</p>
          </div>
        ) : !Array.isArray(labs) || labs.length === 0 ? (
          <div className="text-center py-24 medical-card border-dashed border-2 bg-transparent" role="status">
            <div className="rounded-3xl bg-slate-50 p-8 w-fit mx-auto mb-6 text-medical-text-light opacity-30" aria-hidden="true">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.34a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 00-.586 1.414l.05.05a2 2 0 001.414.586h16.356a2 2 0 001.414-.586l.05-.05a2 2 0 00-.586-1.414l-1.168-1.168z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-secondary tracking-tight">No Laboratories Found</h3>
            <p className="text-medical-text-light mt-2 font-medium max-w-sm mx-auto">
              We couldn't find any labs matching your criteria. Try increasing the search radius or searching for a different test.
            </p>
            <button 
              onClick={() => {setRadius(10000); setLastSearched(""); fetchLabs({radius: 10000})}}
              className="mt-8 btn-secondary !py-3 !px-8 focus:ring-offset-2"
              aria-label="Reset filters and show labs within 10km"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8" role="list" aria-label="Diagnostic laboratory results">
            {labs.map((lab) => (
              <article
                key={lab.id || lab._id}
                role="listitem"
                className="medical-card p-6 md:p-10 hover:border-primary/20 transition-all group relative overflow-hidden focus-within:ring-2 focus-within:ring-primary outline-none"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" aria-hidden="true" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-3xl font-black text-secondary tracking-tight">
                        {lab.name}
                      </h2>
                      {lab.rating && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-black" aria-label={`Rating: ${lab.rating.toFixed(1)} stars`}>
                           <span className="text-amber-400" aria-hidden="true">★</span> {lab.rating.toFixed(1)}
                        </div>
                      )}
                      <div className="px-3 py-1 bg-slate-50 text-medical-text-light rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                        {lab.city}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-sm font-bold text-medical-text-light">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span aria-label={`Business hours: ${lab.openTime} to ${lab.closeTime}`}>{lab.openTime} – {lab.closeTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1.01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${lab.phone}`} className="hover:text-primary transition-colors focus:outline-none focus:underline" aria-label={`Call ${lab.name} at ${lab.phone}`}>{lab.phone}</a>
                      </div>
                    </div>
                  </div>

                  {lab.distanceInKm !== undefined && (
                    <div className="lg:text-right" aria-label={`Distance: ${lab.distanceInKm.toFixed(1)} kilometers`}>
                      <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest mb-1" aria-hidden="true">Estimated Distance</p>
                      <p className="text-3xl font-black text-primary">{lab.distanceInKm.toFixed(1)} <span className="text-sm font-bold">KM</span></p>
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-10 border-t border-slate-50">
                  <h3 className="text-[10px] font-black text-medical-text-light uppercase tracking-[0.2em] mb-6">
                    Clinical Investigations
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
                    {lab.tests && lab.tests.map((test) => (
                      <div
                        key={test.id || test._id}
                        role="listitem"
                        className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between group/test hover:border-primary/30 transition-all"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-black text-secondary leading-tight">{test.name}</p>
                          {test.homeCollection && (
                            <span className="inline-flex items-center text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-tighter">
                              Home Collection Available
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-medical-text-light line-through opacity-40" aria-hidden="true">₹{(test.price * 1.2).toFixed(0)}</p>
                          <p className="text-lg font-black text-primary" aria-label={`Price: ${test.price} rupees`}>₹{test.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    className="btn-primary !px-8 !py-3 !text-xs !uppercase tracking-widest focus-visible:ring-offset-2"
                    aria-label={`Book an appointment at ${lab.name}`}
                  >
                    Book Laboratory Appointment
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
