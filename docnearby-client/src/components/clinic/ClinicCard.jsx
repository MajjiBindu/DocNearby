import { Link } from "react-router-dom";

export default function ClinicCard({ clinic }) {
  const name = clinic?.name || "Clinical Center";
  const address = clinic?.address || "";
  const city = clinic?.city || "";
  const phone = clinic?.phone || "";
  const doctorCount = clinic?.doctors?.length || 0;

  return (
    <div className="medical-card p-6 group hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Healthcare Facility</span>
          </div>
          <h3 className="text-xl font-black text-secondary tracking-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="mt-1 text-sm font-bold text-medical-text-light line-clamp-1">{address}</p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-widest shrink-0">
          {doctorCount} Specialist{doctorCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-xs font-bold text-medical-text-light">
          <svg className="w-4 h-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{city} {phone && `• ${phone}`}</span>
        </div>

        <Link
          to={`/clinics/${clinic?._id}`}
          className="btn-primary !py-3 !text-xs !uppercase tracking-widest w-full text-center"
        >
          View Center Details
        </Link>
      </div>
    </div>
  );
}
