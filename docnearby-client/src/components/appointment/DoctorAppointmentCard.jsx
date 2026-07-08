import { formatDate } from "../../utils/formatDate.js";
import { memo } from "react";
import AppointmentTimeline from "./AppointmentTimeline.jsx";

const DoctorAppointmentCard = memo(({ appt, onConfirm, onArrive, onStartConsult, onComplete, onSharePrescription }) => {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm focus-within:ring-2 focus-within:ring-primary outline-none transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
            {appt?.patientId?.name?.charAt(0) || "P"}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              {appt?.patientId?.name || "Unknown Patient"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {appt?.patientId?.email}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
            <p className="text-sm font-bold text-secondary">
              <time dateTime={appt?.date}>{formatDate(appt?.date)}</time>
            </p>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block w-fit mt-1">
              {appt?.slot}
            </span>
        </div>
      </div>
      
      <AppointmentTimeline status={appt?.status} />
      
      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        {(appt.status === "pending" || appt.status === "booked") && onConfirm && (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none active:scale-95"
            onClick={onConfirm}
            aria-label={`Confirm appointment for ${appt?.patientId?.name || "patient"}`}
          >
            Confirm Booking
          </button>
        )}
        
        {appt.status === "confirmed" && onArrive && (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none active:scale-95"
            onClick={onArrive}
            aria-label={`Mark ${appt?.patientId?.name || "patient"} as arrived`}
          >
            Mark as Arrived
          </button>
        )}
        
        {appt.status === "arrived" && onStartConsult && (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none active:scale-95"
            onClick={onStartConsult}
            aria-label={`Start consultation with ${appt?.patientId?.name || "patient"}`}
          >
            Start Consultation
          </button>
        )}
        
        {appt.status === "in_consultation" && onComplete && (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none active:scale-95"
            onClick={onComplete}
            aria-label={`Mark appointment for ${appt?.patientId?.name || "patient"} as completed`}
          >
            Complete Visit
          </button>
        )}
        
        {appt.status === "completed" && onSharePrescription && (
          <button
            type="button"
            className="w-full sm:w-auto rounded-md bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-600 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none active:scale-95"
            onClick={onSharePrescription}
            aria-label={`Share prescription with ${appt?.patientId?.name || "patient"}`}
          >
            Share Prescription
          </button>
        )}
      </div>
    </article>
  );
});

export default DoctorAppointmentCard;
