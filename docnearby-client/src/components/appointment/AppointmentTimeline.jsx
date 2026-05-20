import { memo } from "react";

// Steps in the happy path flow
const STEPS = [
  { id: "booked", label: "Booked", description: "Slot reserved successfully" },
  { id: "confirmed", label: "Confirmed", description: "Clinician confirmed appointment" },
  { id: "arrived", label: "Arrived", description: "Checked-in at clinic/queue" },
  { id: "in_consultation", label: "In Consultation", description: "Active medical encounter" },
  { id: "completed", label: "Completed", description: "Visit completed" },
  { id: "prescription_shared", label: "Prescription", description: "Digital assets dispatched" },
];

const AppointmentTimeline = memo(({ status }) => {
  // Defensive check and normalization
  const normalizedStatus = (status || "booked").toLowerCase().trim();

  // Handle cancelled state as a special visual terminated timeline
  const isCancelled = normalizedStatus === "cancelled";

  // Map legacy 'pending' to 'booked' for visual consistency
  const activeStatus = normalizedStatus === "pending" ? "booked" : normalizedStatus;

  // Find index of current status in happy path
  const currentStepIndex = STEPS.findIndex((step) => step.id === activeStatus);

  // If status is not cancelled and not in STEPS, render graceful fallback
  const isUnknownStatus = !isCancelled && currentStepIndex === -1;

  if (isCancelled) {
    return (
      <div className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl p-5 mt-4 transition-all duration-300 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-md shadow-rose-200">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider">Appointment Cancelled</h4>
            <p className="text-xs font-bold text-rose-700 mt-0.5">
              This appointment has been cancelled. The slot has been released back to the general availability queue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isUnknownStatus) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 font-bold">
            ?
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Current Status</span>
            <span className="text-sm font-black text-slate-700 capitalize">{normalizedStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-5 bg-slate-50/50 border border-slate-100/60 rounded-3xl p-5 md:p-6 transition-all duration-300">
      {/* Horizontal timeline for desktop / Tablet screens (md and above) */}
      <div className="hidden md:block w-full">
        <div className="flex items-center justify-between w-full relative">
          {/* Background progress track line */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-10 rounded-full" />
          {/* Active progress track line */}
          <div 
            className="absolute top-5 left-8 h-1 bg-gradient-to-r from-primary to-emerald-500 -z-10 rounded-full transition-all duration-500" 
            style={{
              width: `${(currentStepIndex / (STEPS.length - 1)) * 90}%`
            }}
          />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && currentStepIndex === STEPS.length - 1);
            const isActive = idx === currentStepIndex && !isCompleted;
            const isUpcoming = idx > currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1 text-center group">
                {/* Visual Step Marker */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-100" 
                      : isActive 
                      ? "bg-primary border-primary text-white shadow-primary/30 scale-110 ring-4 ring-primary/10 animate-pulse" 
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-scale" />
                  ) : (
                    <span className="text-xs font-extrabold">{idx + 1}</span>
                  )}
                </div>

                {/* Step Metadata */}
                <div className="mt-3 px-1">
                  <p 
                    className={`text-xs font-black uppercase tracking-wider transition-colors duration-200 ${
                      isActive 
                        ? "text-primary" 
                        : isCompleted 
                        ? "text-slate-800" 
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 line-clamp-1 max-w-[120px]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical timeline for mobile screens */}
      <div className="md:hidden flex flex-col gap-6 relative pl-3">
        {/* Background track line */}
        <div className="absolute top-5 bottom-5 left-7 w-0.5 bg-slate-100 -z-10 rounded-full" />
        {/* Active progress track line */}
        <div 
          className="absolute top-5 left-7 w-0.5 bg-gradient-to-b from-primary to-emerald-500 -z-10 rounded-full transition-all duration-500" 
          style={{
            height: `${(currentStepIndex / (STEPS.length - 1)) * 82}%`
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && currentStepIndex === STEPS.length - 1);
          const isActive = idx === currentStepIndex && !isCompleted;

          return (
            <div key={step.id} className="flex items-center gap-4 group">
              {/* Visual Step Marker */}
              <div 
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-100" 
                    : isActive 
                    ? "bg-primary border-primary text-white shadow-primary/30 ring-4 ring-primary/10 scale-105" 
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <span className="text-[10px] font-extrabold">{idx + 1}</span>
                )}
              </div>

              {/* Step Metadata */}
              <div>
                <p 
                  className={`text-xs font-black uppercase tracking-wider ${
                    isActive 
                      ? "text-primary" 
                      : isCompleted 
                      ? "text-slate-800" 
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AppointmentTimeline;
