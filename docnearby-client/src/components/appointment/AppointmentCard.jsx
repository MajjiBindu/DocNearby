import { formatDate } from "../../utils/formatDate.js";

export default function AppointmentCard({ appt, onCancel, onComplete }) {
  return (
    <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <p className="font-medium text-slate-900 text-sm md:text-base">
            {appt?.doctorId?.userId?.name || "Doctor"} •{" "}
            {appt?.doctorId?.specialty || ""}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {formatDate(appt?.date)} • {appt?.slot}
          </p>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            {appt?.clinicId?.name}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 self-start">
          {appt?.status}
        </span>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2">
        {onCancel ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md border px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
        {onComplete ? (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 transition-colors"
            onClick={onComplete}
          >
            Mark completed
          </button>
        ) : null}
      </div>
    </div>
  );
}
