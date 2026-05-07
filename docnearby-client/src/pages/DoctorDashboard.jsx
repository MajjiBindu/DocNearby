import { useEffect, useState } from "react";
import Spinner from "../components/common/Spinner.jsx";
import Modal from "../components/common/Modal.jsx";
import { appointmentApi } from "../services/api.js";
import translations from "../utils/i18n.js";

export default function DoctorDashboard() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handleLangChange = () =>
      setLang(localStorage.getItem("dn_lang") || "en");
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentApi.doctor();
      const list = Array.isArray(data) ? data : (data?.appointments ?? []);
      setAppointments(list);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load bookings",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const todays = appointments
    .filter((a) => {
      if (!a.date) return false;
      const apptDate = new Date(a.date).toISOString().slice(0, 10);
      return apptDate === todayStr;
    })
    .sort((a, b) => a.slot?.localeCompare(b.slot ?? ""));

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentApi.updateStatus(id, status);
      await load();
    } catch (e) {
      console.error("Status update failed", e);
      setError("Failed to update appointment status.");
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t.doctorDashboard}
            </h1>
            <p className="text-slate-500">
              Manage your daily appointments and schedule.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-indigo-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95"
          >
            {t.editAvailability}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {t.dailySchedule}
              </h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {todayStr}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-[400px]">
            {loading && appointments.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                <Spinner className="h-8 w-8 text-indigo-600" />
                <p className="text-sm font-medium text-slate-500">
                  Syncing your schedule...
                </p>
              </div>
            ) : todays.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-slate-400 p-8 animate-in fade-in duration-500">
                <div className="rounded-full bg-slate-50 p-4">
                  <svg
                    className="h-10 w-10 opacity-30 text-slate-400"
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
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    {t.noSchedule}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Enjoy your free time or check your future bookings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/30 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-4">Time Slot</th>
                      <th className="px-6 py-4">Patient Information</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todays.map((a) => (
                      <tr
                        key={a._id}
                        className="group transition-all hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <svg
                                className="h-4 w-4"
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
                            </div>
                            {a.slot}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-700">
                              {a.patientId?.name || "Anonymous Patient"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="h-3 w-3 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <a
                                href={`tel:${a.patientId?.phone}`}
                                className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700"
                              >
                                {a.patientId?.phone || "No contact info"}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(a.status)}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {a.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(a._id, "confirmed")
                                }
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
                              >
                                {t.confirmBtn}
                              </button>
                            )}
                            {a.status === "confirmed" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(a._id, "completed")
                                }
                                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
                              >
                                {t.markComplete}
                              </button>
                            )}
                            {(a.status === "pending" ||
                              a.status === "confirmed") && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(a._id, "cancelled")
                                }
                                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 active:scale-95"
                              >
                                {t.cancelBtn}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <Modal
          open={modalOpen}
          title={t.editAvailability}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-6 py-2">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-inner">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Integration Details
                </h4>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>
                  To update your availability slots, please use the following
                  endpoint:
                </p>
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative flex items-center justify-between rounded-lg bg-slate-900 p-4 font-mono text-xs text-indigo-300">
                    <span>PUT /api/doctors/:id</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                {t.brand} - OK
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
