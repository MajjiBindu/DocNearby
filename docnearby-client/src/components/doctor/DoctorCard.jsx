import { Link } from "react-router-dom";
import { memo } from "react";

const DoctorCard = memo(({ doctor }) => {
  const name = doctor?.userId?.name || "Doctor";
  const specialty = doctor?.specialty || "";
  const fee = doctor?.consultationFee ?? null;
  const clinicName = doctor?.clinicId?.name || "";
  const city = doctor?.clinicId?.city || "";

  return (
    <div className="medical-card group p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-secondary text-lg md:text-xl leading-snug group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-wider w-fit mt-1.5 mb-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </div>
          <p className="text-sm font-bold text-primary uppercase tracking-wide">{specialty}</p>
          <p className="mt-2 text-sm text-medical-text-light flex items-start gap-1">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{clinicName}{clinicName && city ? ", " : ""}{city}</span>
          </p>
        </div>
        {fee !== null && (
          <div className="text-right shrink-0">
            <p className="text-xs font-black text-medical-text-light uppercase tracking-widest">Consultation</p>
            <p className="text-xl font-black text-secondary">₹{fee}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(doctor?.rating || 0) ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs font-bold text-secondary">{doctor?.rating?.toFixed?.(1) ?? "0.0"}</span>
          <span className="text-xs text-medical-text-light">( {doctor?.reviewCount ?? 0} reviews )</span>
        </div>
        
        <Link
          to={`/doctors/${doctor?._id}`}
          className="btn-primary px-6 py-2 text-xs rounded-lg text-center"
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
});

export default DoctorCard;
