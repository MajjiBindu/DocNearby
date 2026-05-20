import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SlotPicker from "../components/appointment/SlotPicker.jsx";
import CalendarPicker from "../components/appointment/CalendarPicker.jsx";
import { appointmentApi, doctorApi } from "../services/api.js";
import { useAuth } from "../context/useAuth.js";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(todayIso());
  const [slot, setSlot] = useState("");
  const [slotInfo, setSlotInfo] = useState({ available: [], booked: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token)
      navigate("/login", { replace: true, state: { from: `/book/${id}` } });
  }, [token, navigate, id]);

  useEffect(() => {
    let cancelled = false;
    async function loadDoctor() {
      try {
        const res = await doctorApi.get(id);
        if (!cancelled) {
          setDoctor(res?.data?.doctor || null);
        }
      } catch (e) {
        console.error("Failed to load doctor profile", e);
      }
    }
    loadDoctor();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoadingSlots(true);
      setMessage("");
      try {
        const res = await doctorApi.slots(id, date);
        const nextAvailable = res?.data?.available || [];
        const nextBooked = res?.data?.booked || [];
        if (!cancelled) {
          setSlotInfo({ available: nextAvailable, booked: nextBooked });
          setSlot(nextAvailable.includes(slot) ? slot : "");
        }
      } catch (e) {
        if (!cancelled) setMessage(e?.message || "Failed to load slots");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date]);

  const isOnboardingComplete = useMemo(() => {
    if (!doctor) return false;
    const hasPhoto = !!doctor.profilePhoto;
    const hasQualifications = Array.isArray(doctor.qualifications) && doctor.qualifications.length > 0;
    const hasClinic = !!doctor.clinicId;
    const hasAvailability = Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0;
    const hasBio = !!doctor.bio && doctor.bio.trim().length > 0;
    return hasPhoto && hasQualifications && hasClinic && hasAvailability && hasBio;
  }, [doctor]);

  const canSubmit = useMemo(
    () => !!date && !!slot && !submitting && isOnboardingComplete,
    [date, slot, submitting, isOnboardingComplete],
  );

  const confirm = async () => {
    if (!date || !slot) {
      setMessage("Please select both a date and a time slot.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const res = await appointmentApi.create({ doctorId: id, date, slot });
      if (res?.success) {
        setMessage("Booked successfully.");
        navigate("/patient");
      } else {
        setMessage(res?.message || "Booking failed");
      }
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-grey pb-20 pt-8 sm:pt-12">
      <div className="mx-auto max-w-3xl px-4 space-y-8">
        <div className="medical-card p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-secondary tracking-tight">
                Secure Booking
              </h1>
              <p className="text-sm text-medical-text-light font-medium">
                Reserve your clinical consultation slot
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Doctor Profile Summary Banner */}
            {doctor && (
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                  {doctor.userId?.name?.charAt(0) || "D"}
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-black text-secondary text-lg">Dr. {doctor.userId?.name || "Clinician"}</h4>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mt-0.5">{doctor.specialty || "Specialist"}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                      Fee: ₹{doctor.consultationFee || 0}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                      Exp: {doctor.experience || 0} Years
                    </span>
                  </div>
                </div>
              </div>
            )}

            {doctor && !isOnboardingComplete && (
              <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100/50 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-rose-100 shrink-0">
                  !
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-rose-950 text-sm uppercase tracking-tight">Onboarding Check Incomplete</h4>
                  <p className="text-xs text-rose-800 leading-relaxed font-semibold">
                    Dr. {doctor.userId?.name || "Clinician"} has not finalized their professional profile. 
                    Public booking will remain inactive until profile photo, qualifications, clinic, weekly slots, and biography are completed.
                  </p>
                </div>
              </div>
            )}

            {isOnboardingComplete && (
              <>
                {/* Interactive Availability Calendar */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-medical-text-light uppercase tracking-[0.2em] block">
                    1. Select Consultation Date
                  </label>
                  <CalendarPicker
                    selectedDate={date}
                    onSelectDate={(newDate) => {
                      setDate(newDate);
                      setSlot("");
                      setMessage("");
                    }}
                    availableSlots={doctor?.availableSlots || []}
                  />
                </div>

                {/* Hourly Slot Selector */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <label className="text-[10px] font-black text-medical-text-light uppercase tracking-[0.2em]">
                      2. Select Hourly Time Slot
                    </label>
                    {loadingSlots && (
                      <div className="flex items-center gap-2 text-primary" role="status">
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold">Checking availability...</span>
                      </div>
                    )}
                  </div>

                  {date && (
                    <SlotPicker
                      available={slotInfo.available}
                      booked={slotInfo.booked}
                      value={slot}
                      onChange={(val) => {
                        setSlot(val);
                        setMessage("");
                      }}
                    />
                  )}

                  {date && !loadingSlots && !slotInfo.available.length ? (
                    <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100/50 text-center">
                      <p className="text-xs text-rose-600 font-extrabold uppercase tracking-wider">
                        Fully Booked
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        All consultation slots are currently reserved for this date. Please select another day.
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={confirm}
                disabled={!canSubmit}
                className="w-full py-4 rounded-2xl bg-primary text-sm font-black text-white uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-98"
              >
                {submitting ? "Securing Slot..." : "Confirm Secure Booking"}
              </button>
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl border font-bold text-sm flex items-center gap-3 animate-in shake-in duration-300 ${
                  message.includes("successfully")
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}
              >
                {message.includes("successfully") ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
