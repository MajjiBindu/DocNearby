import { formatDate } from "../../utils/formatDate.js";
import { memo } from "react";

const AppointmentCard = memo(({ appt, onCancel, onComplete }) => {
  const isPending = appt?.status === 'pending';
  const isConfirmed = appt?.status === 'confirmed';
  
  return (
    <article className="rounded-xl border bg-white p-4 md:p-6 shadow-sm focus-within:ring-2 focus-within:ring-primary outline-none">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 text-sm md:text-base">
            {appt?.doctorId?.userId?.name || "Doctor"} •{" "}
            <span className="text-primary">{appt?.doctorId?.specialty || "General Specialist"}</span>
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            <time dateTime={appt?.date}>{formatDate(appt?.date)}</time> • {appt?.slot}
          </p>
          <address className="mt-1 text-xs md:text-sm text-slate-500 not-italic">
            {appt?.clinicId?.name || "Clinic"}
          </address>
        </div>
        <span 
          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest self-start ${
            appt?.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
            appt?.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
            appt?.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
          }`}
          role="status"
        >
          {appt?.status}
        </span>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2">
        {onCancel ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md border px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            onClick={onCancel}
            aria-label={`Cancel appointment with Dr. ${appt?.doctorId?.userId?.name}`}
          >
            Cancel
          </button>
        ) : null}
        {onComplete ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-secondary px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            onClick={onComplete}
            aria-label={`Mark appointment with Dr. ${appt?.doctorId?.userId?.name} as completed`}
          >
            Mark completed
          </button>
        ) : null}
      </div>
    </article>
  );
});

export default AppointmentCard;
