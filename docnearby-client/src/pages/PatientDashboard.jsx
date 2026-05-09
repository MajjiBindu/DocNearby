import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../components/appointment/AppointmentCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import Modal from "../components/common/Modal.jsx";
import { appointmentApi } from "../services/api.js";
import translations from "../utils/i18n.js";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    const handleLangChange = () =>
      setLang(localStorage.getItem("dn_lang") || "en");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    // Fetch appointments on component mount
    appointmentApi
      .patient()
      .then((data) => {
        const list =
          data?.data?.appointments ||
          data?.appointments ||
          (Array.isArray(data) ? data : []);
        setAppointments(list);
        setError("");
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message || "Failed to load appointments");
        setLoading(false);
      });
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentApi.patient();
      const list =
        data?.data?.appointments ||
        data?.appointments ||
        (Array.isArray(data) ? data : []);
      setAppointments(list);
    } catch (e) {
      setError(e?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  const now = new Date();

  const toDateTime = (a) => {
    const dateStr = new Date(a.date).toISOString().slice(0, 10);
    // Convert "08:00 PM" → "20:00"
    const [time, meridiem] = (a.slot || "").split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return new Date(
      `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
    );
  };

  const visibleAppointments = appointments.filter(
    (a) => a.status !== "cancelled",
  );

  const upcoming = visibleAppointments.filter((a) => toDateTime(a) > now);
  const pastAppointments = appointments.filter(
    (a) => a.status === "cancelled" || toDateTime(a) <= now,
  );

  const stats = {
    total: visibleAppointments.length,
    upcoming: upcoming.length,
    completed: visibleAppointments.filter((a) => a.status === "completed")
      .length,
  };

  const openCancelModal = (appt) => {
    setCancelTarget(appt);
    setModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await appointmentApi.updateStatus(cancelTarget._id, "cancelled");
      // Update local state immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === cancelTarget._id ? { ...a, status: "cancelled" } : a,
        ),
      );
      // Optional: still reload from server to ensure sync, but the UI is already updated
      loadAppointments();
    } catch (e) {
      console.error("Cancel failed", e);
    } finally {
      setModalOpen(false);
      setCancelTarget(null);
    }
  };

  const renderList = (list) => {
    if (list.length === 0) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 p-12 text-center animate-in fade-in duration-500">
          <div className="rounded-full bg-white/5 p-6">
            <svg
              className="h-12 w-12 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {t.noAppointments}
            </h3>
            <p className="mt-2 text-base text-white/40 font-medium">
              {activeTab === "upcoming"
                ? lang === "en"
                  ? "You don't have any upcoming visits scheduled."
                  : t.noSchedule
                : t.pastHistoryDesc || "Your past history will appear here."}
            </p>
          </div>
          {activeTab === "upcoming" && (
            <button
              onClick={() => navigate("/search")}
              className="mt-4 rounded-2xl bg-redline px-10 py-4 text-lg font-black text-white shadow-2xl shadow-redline/20 transition-all active:scale-95 border-none"
            >
              {t.bookNow}
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {list
          .filter((a) =>
            activeTab === "upcoming" ? a.status !== "cancelled" : true,
          )
          .map((appt) => {
            const isUpcoming = activeTab === "upcoming";
            let borderClass = "rounded-2xl overflow-hidden ";
            if (isUpcoming) {
              borderClass +=
                "border-l-8 border-redline shadow-xl shadow-redline/5";
            } else if (appt.status === "completed") {
              borderClass += "border-l-8 border-emerald-500 opacity-80";
            } else if (appt.status === "cancelled") {
              borderClass += "border-l-8 border-slate-300 opacity-60";
            }

            const canCancel =
              appt.status === "pending" || appt.status === "confirmed";

            return (
              <div
                key={appt._id}
                className={`${borderClass} [&_button]:!rounded-xl [&_button]:!border-2 [&_button]:!border-redline [&_button]:!text-redline [&_button]:!font-black hover:[&_button]:!bg-redline hover:[&_button]:!text-white transition-all`}
              >
                <AppointmentCard
                  appt={appt}
                  onCancel={canCancel ? () => openCancelModal(appt) : undefined}
                />
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block h-fit rounded-[2.5rem] bg-purple-shadow border border-white/10 p-8 shadow-2xl shadow-black/30 sticky top-24">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-8">
              Dashboard
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === "upcoming" ? "bg-redline text-white shadow-lg shadow-redline/20" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <svg
                  className="h-5 w-5"
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
                {t.upcoming}
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === "past" ? "bg-redline text-white shadow-lg shadow-redline/20" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t.past}
              </button>
            </nav>

            <div className="mt-12 p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center">
              <p className="text-xs font-semibold text-white/40 mb-4 leading-relaxed">
                Need a new appointment?
              </p>
              <button
                onClick={() => navigate("/search")}
                className="w-full py-4 rounded-xl bg-redline text-white font-black text-sm hover:bg-redline/90 transition-all active:scale-95 shadow-lg shadow-redline/20"
              >
                {t.bookNow}
              </button>
            </div>
          </aside>

          <main className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {t.appointments}
                </h1>
                <p className="text-white/40 text-base font-medium">
                  View and manage your healthcare schedule.
                </p>
              </div>
              {loading && appointments.length > 0 && (
                <Spinner className="h-6 w-6 text-redline" />
              )}
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="group rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5 hover:-translate-y-1 transition-all duration-300">
                <div className="h-2 bg-blue-popsicle" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Total
                  </p>
                  <p className="text-3xl font-black text-blue-popsicle">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="group rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5 hover:-translate-y-1 transition-all duration-300">
                <div className="h-2 bg-redline" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Upcoming
                  </p>
                  <p className="text-3xl font-black text-blue-popsicle">
                    {stats.upcoming}
                  </p>
                </div>
              </div>
              <div className="group rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5 hover:-translate-y-1 transition-all duration-300">
                <div className="h-2 bg-emerald-500" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-black text-blue-popsicle">
                    {stats.completed}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex gap-2 p-1.5 w-fit rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <button
                className={`rounded-xl px-6 py-3 text-sm font-black tracking-tight transition-all ${
                  activeTab === "upcoming"
                    ? "bg-redline text-white shadow-lg shadow-redline/20"
                    : "text-white/40 hover:text-white"
                }`}
                onClick={() => setActiveTab("upcoming")}
              >
                {t.upcoming}
              </button>
              <button
                className={`rounded-xl px-6 py-3 text-sm font-black tracking-tight transition-all ${
                  activeTab === "past"
                    ? "bg-redline text-white shadow-lg shadow-redline/20"
                    : "text-white/40 hover:text-white"
                }`}
                onClick={() => setActiveTab("past")}
              >
                {t.past}
              </button>
            </div>

            {loading && appointments.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 animate-in fade-in duration-500">
                <Spinner className="h-10 w-10 text-redline" />
                <p className="text-sm font-bold text-white/40">
                  {t.loadingSchedule}
                </p>
              </div>
            ) : activeTab === "upcoming" ? (
              renderList(upcoming)
            ) : (
              renderList(pastAppointments)
            )}
          </main>
        </div>
      </div>
      <Modal
        open={modalOpen}
        title={t.cancelBtn}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-6 py-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to cancel this appointment? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              onClick={() => setModalOpen(false)}
            >
              Keep
            </button>
            <button
              type="button"
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
              onClick={confirmCancel}
            >
              {t.cancelBtn}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
