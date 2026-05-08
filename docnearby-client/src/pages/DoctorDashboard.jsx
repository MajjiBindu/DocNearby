import { useEffect, useState } from "react";
import Spinner from "../components/common/Spinner.jsx";
import Modal from "../components/common/Modal.jsx";
import { appointmentApi, doctorApi } from "../services/api.js";
import translations from "../utils/i18n.js";

export default function DoctorDashboard() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  const loadDoctor = async () => {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const data = await doctorApi.me();
      setDoctor(data.doctor || null);
    } catch (e) {
      setAvailabilityError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load doctor profile",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadDoctor();
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

  useEffect(() => {
    if (!modalOpen || !doctor) return;

    const initialRows = (doctor.availableSlots || []).map((slot) => ({
      day: slot.day || "Mon",
      startTime: slot.startTime || "09:00",
      endTime: slot.endTime || "17:00",
      slotDuration: slot.slotDuration || 30,
    }));

    setAvailabilityRows(
      initialRows.length
        ? initialRows
        : [
            {
              day: "Mon",
              startTime: "09:00",
              endTime: "17:00",
              slotDuration: 30,
            },
          ],
    );
    setAvailabilityError("");
  }, [modalOpen, doctor]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const validateAvailabilityRows = (rows) => {
    const cleaned = rows.map((row) => ({
      day: String(row.day || "").trim(),
      startTime: String(row.startTime || "").trim(),
      endTime: String(row.endTime || "").trim(),
      slotDuration: Number(row.slotDuration) || 30,
    }));

    if (cleaned.length === 0) {
      return { ok: false, message: "Add at least one availability slot." };
    }

    for (const row of cleaned) {
      if (!DAY_OPTIONS.includes(row.day)) {
        return {
          ok: false,
          message: "Please choose a valid day for each slot.",
        };
      }
      if (
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(row.startTime) ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(row.endTime)
      ) {
        return {
          ok: false,
          message: "Use a valid HH:mm start and end time for each slot.",
        };
      }
      if (row.startTime >= row.endTime) {
        return {
          ok: false,
          message: "Start time must come before end time for each slot.",
        };
      }
    }

    const grouped = cleaned.reduce((acc, slot) => {
      acc[slot.day] = acc[slot.day] || [];
      acc[slot.day].push(slot);
      return acc;
    }, {});

    for (const day of Object.keys(grouped)) {
      const sorted = grouped[day]
        .slice()
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let index = 1; index < sorted.length; index += 1) {
        const prevEnd = sorted[index - 1].endTime;
        const currentStart = sorted[index].startTime;
        if (currentStart < prevEnd) {
          return {
            ok: false,
            message: `Availability slots on ${day} cannot overlap. Please adjust your times.`,
          };
        }
      }
    }

    return { ok: true, slots: cleaned };
  };

  const handleAvailabilityChange = (index, field, value) => {
    setAvailabilityRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addAvailabilityRow = () => {
    setAvailabilityRows((prev) => [
      ...prev,
      { day: "Mon", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    ]);
    setAvailabilityError("");
  };

  const removeAvailabilityRow = (index) => {
    setAvailabilityRows((prev) => prev.filter((_, idx) => idx !== index));
    setAvailabilityError("");
  };

  const saveAvailability = async () => {
    const validation = validateAvailabilityRows(availabilityRows);
    if (!validation.ok) {
      setAvailabilityError(validation.message);
      return;
    }

    if (!doctor?._id) {
      setAvailabilityError(
        "Unable to save availability without a valid doctor profile.",
      );
      return;
    }

    setSavingAvailability(true);
    setAvailabilityError("");
    try {
      const payload = { availableSlots: validation.slots };
      const data = await doctorApi.updateAvailability(doctor._id, payload);
      setDoctor(data.doctor);
      setAvailabilityRows(
        (data.doctor.availableSlots || []).map((slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || 30,
        })),
      );
      setToast("Availability saved successfully.");
      setToastType("success");
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to save availability";
      setAvailabilityError(message);
      setToast(message);
      setToastType("error");
    } finally {
      setSavingAvailability(false);
    }
  };

  const getAvailabilityLabel = () => {
    if (!doctor) return "Loading availability...";
    return doctor.availableSlots?.length
      ? `${doctor.availableSlots.length} saved slot${doctor.availableSlots.length === 1 ? "" : "s"}`
      : "No availability slots saved yet";
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
                                  d="M16 12H8m8 0a4 4 0 10-8 0m8 0v1a2 2 0 104 0v-1a8 8 0 10-4 6.93"
                                />
                              </svg>
                              <a
                                href={`mailto:${a.patientId?.email}`}
                                className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700"
                              >
                                {a.patientId?.email || "No contact info"}
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
            {toast && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  toastType === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-rose-50 text-rose-900 border border-rose-200"
                }`}
              >
                {toast}
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">
                    Manage your availability
                  </h4>
                  <p className="text-sm text-slate-500">
                    Add days and time ranges for your consultation slots.
                  </p>
                </div>
                <div className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {getAvailabilityLabel()}
                </div>
              </div>

              {availabilityLoading ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-3xl bg-white/60 p-8 text-sm text-slate-500">
                  Loading your doctor profile...
                </div>
              ) : (
                <div className="space-y-4">
                  {availabilityRows.map((slot, index) => (
                    <div
                      key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}
                      className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1.2fr_1fr_1fr_auto]"
                    >
                      <label className="block text-sm font-medium text-slate-700">
                        Day
                        <select
                          value={slot.day}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              "day",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                          {DAY_OPTIONS.map((dayOption) => (
                            <option key={dayOption} value={dayOption}>
                              {dayOption}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Start time
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              "startTime",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        End time
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              "endTime",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => removeAvailabilityRow(index)}
                          className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addAvailabilityRow}
                    className="inline-flex items-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                  >
                    + Add slot
                  </button>
                </div>
              )}

              {availabilityError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {availabilityError}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveAvailability}
                disabled={savingAvailability || availabilityLoading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {savingAvailability ? "Saving..." : "Save Availability"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
