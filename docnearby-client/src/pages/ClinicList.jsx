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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Nearby Clinics</h1>
        <p className="text-slate-600">
          Find the best clinics and hospitals near your current location.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">{t.loading}</p>
        </div>
      ) : clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic._id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
             <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No clinics found</h3>
          <p className="text-slate-500 mt-2">Try expanding your search or checking another location.</p>
        </div>
      )}
    </div>
  );
}
