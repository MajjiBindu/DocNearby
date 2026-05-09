import { Link } from "react-router-dom";

export default function ClinicCard({ clinic }) {
  const name = clinic?.name || "Clinic";
  const address = clinic?.address || "";
  const city = clinic?.city || "";
  const phone = clinic?.phone || "";
  const doctorCount = clinic?.doctors?.length || 0;

  return (
    <div className="group rounded-2xl border border-grey-blue-leaf/20 bg-white p-5 md:p-6 shadow-sm hover:shadow-2xl hover:shadow-blue-popsicle/10 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-blue-popsicle text-xl truncate">
            {name}
          </h3>
          <p className="text-sm font-semibold text-grey-blue-leaf line-clamp-1">{address}</p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {city}
            {city && phone ? " • " : ""}
            {phone}
          </p>
        </div>
        <span className="rounded-xl bg-redline/10 px-3 py-1.5 text-xs font-bold text-redline shrink-0 border border-redline/10">
          {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
           <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
           </svg>
           <span className="text-xs text-slate-500">View on Map</span>
        </div>
        <Link
          to={`/clinics/${clinic?._id}`}
          className="rounded-xl bg-redline text-white px-5 py-2 text-sm font-bold hover:bg-redline/90 shadow-lg shadow-redline/20 transition-all active:scale-95"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
