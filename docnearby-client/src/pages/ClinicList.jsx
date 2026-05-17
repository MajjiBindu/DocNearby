import { useState, useEffect } from "react";
import { useLocation } from "../context/LocationContext";
import { clinicApi } from "../services/api";
import ClinicCard from "../components/clinic/ClinicCard";
import translations from "../utils/i18n";

export default function ClinicList() {
  const { coords } = useLocation();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem("dn_lang") || "en");

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem("dn_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    async function fetchClinics() {
      setLoading(true);
      try {
        const params = {};
        if (coords) {
          params.lat = coords.lat;
          params.lng = coords.lng;
          params.radius = 5000; // 5km
        }
        const res = await clinicApi.list(params);
        if (res.success) {
          setClinics(res.data.clinics);
        }
      } catch (error) {
        console.error("Failed to fetch clinics", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClinics();
  }, [coords]);

  return (
    <div className="bg-medical-grey min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="section-container">
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">Clinical Network</h1>
          <p className="text-medical-text-light mt-2 text-lg font-medium max-w-2xl">
            Discover independent medical clinics and healthcare hospitals in your vicinity.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">Scanning Local Facilities</p>
          </div>
        ) : clinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {clinics.map((clinic) => (
              <ClinicCard key={clinic._id} clinic={clinic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 medical-card border-dashed border-2 bg-transparent">
            <div className="rounded-3xl bg-slate-50 p-8 w-fit mx-auto mb-6 text-medical-text-light opacity-30">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-secondary tracking-tight">No Nearby Clinics Found</h3>
            <p className="text-medical-text-light mt-2 font-medium max-w-sm mx-auto">
              We couldn't locate any registered clinics in your immediate area. Try expanding your search or selecting a different city.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 btn-secondary !py-3 !px-8"
            >
              Refresh Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
