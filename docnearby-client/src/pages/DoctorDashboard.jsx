import { useEffect, useState } from "react";
import Spinner from "../components/common/Spinner.jsx";
import Modal from "../components/common/Modal.jsx";
import { appointmentApi, doctorApi } from "../services/api.js";
import { LANGUAGES, SPECIALTIES } from "../utils/constants.js";
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
  const [profileForm, setProfileForm] = useState({
    specialty: "",
    experience: "",
    consultationFee: "",
    languages: [],
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
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
      console.log("appointmentApi.doctor() returned:", data);
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
      setDoctor(data.data?.doctor || null);
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
        return "bg-grey-blue-leaf/10 text-grey-blue-leaf border-grey-blue-leaf/20";
      case "confirmed":
        return "bg-redline/10 text-redline border-redline/20";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-slate-100 text-slate-400 border-slate-200";
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
      clinicName: slot.clinicName || "",
      location: slot.location || "",
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
              clinicName: "",
              location: "",
            },
          ],
    );
    setProfileForm({
      specialty: doctor.specialty || "",
      experience: doctor.experience != null ? String(doctor.experience) : "",
      consultationFee:
        doctor.consultationFee != null ? String(doctor.consultationFee) : "",
      languages: doctor.languages || [],
    });
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
      clinicName: String(row.clinicName || "").trim(),
      location: String(row.location || "").trim(),
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
      {
        day: "Mon",
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        clinicName: "",
        location: "",
      },
    ]);
    setAvailabilityError("");
  };

  const removeAvailabilityRow = (index) => {
    setAvailabilityRows((prev) => prev.filter((_, idx) => idx !== index));
    setAvailabilityError("");
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProfileLanguage = (language) => {
    setProfileForm((prev) => {
      const selected = prev.languages.includes(language);
      return {
        ...prev,
        languages: selected
          ? prev.languages.filter((item) => item !== language)
          : [...prev.languages, language],
      };
    });
  };

  const saveProfile = async () => {
    if (!doctor?._id) {
      setToast("Unable to save profile without a valid doctor profile.");
      setToastType("error");
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        specialty: profileForm.specialty,
        experience: Number(profileForm.experience || 0),
        consultationFee: Number(profileForm.consultationFee || 0),
        languages: profileForm.languages,
      };
      const data = await doctorApi.update(doctor._id, payload);
      const updatedDoctor = data.data?.doctor;
      setDoctor(updatedDoctor || null);
      setToast("Profile saved successfully.");
      setToastType("success");
    } catch (e) {
      const message =
        e?.response?.data?.message || e?.message || "Unable to save profile";
      setToast(message);
      setToastType("error");
    } finally {
      setSavingProfile(false);
    }
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
      const updatedDoctor = data.data?.doctor;
      setDoctor(updatedDoctor || null);
      setAvailabilityRows(
        (updatedDoctor?.availableSlots || []).map((slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || 30,
          clinicName: slot.clinicName || "",
          location: slot.location || "",
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
    <div className="min-h-screen bg-transparent pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block h-fit rounded-[2.5rem] bg-purple-shadow border border-white/10 p-8 shadow-2xl shadow-black/30 sticky top-24">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-8">
              Management
            </h2>
            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black bg-redline text-white shadow-lg shadow-redline/20 transition-all">
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
                {t.dailySchedule}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {t.editAvailability}
              </button>
            </nav>

            <div className="mt-12 p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-popsicle to-purple-shadow flex items-center justify-center text-white text-2xl font-black shadow-xl">
                {doctor?.userId?.name?.charAt(0) || "D"}
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest">
                {doctor?.specialty}
              </p>
              <p className="mt-1 text-xs font-medium text-white/40">
                {doctor?.availableSlots?.length || 0} active slots
              </p>
            </div>
          </aside>

          <main className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {t.doctorDashboard}
                </h1>
                <p className="text-white/40 text-base font-medium">
                  Manage your daily appointments and schedule.
                </p>
              </div>
              <div className="flex gap-4">
                {loading && appointments.length > 0 && (
                  <Spinner className="h-6 w-6 text-redline" />
                )}
                <button
                  onClick={load}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="lg:hidden inline-flex items-center justify-center rounded-xl bg-redline px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-redline/20 active:scale-95 transition-all"
                >
                  {t.editAvailability}
                </button>
              </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5">
                <div className="h-2 bg-blue-popsicle" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Total Bookings
                  </p>
                  <p className="text-3xl font-black text-blue-popsicle">
                    {appointments.length}
                  </p>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5">
                <div className="h-2 bg-redline" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Today's Visits
                  </p>
                  <p className="text-3xl font-black text-blue-popsicle">
                    {todays.length}
                  </p>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-white overflow-hidden shadow-2xl shadow-grey-blue-leaf/5">
                <div className="h-2 bg-emerald-500" />
                <div className="p-6">
                  <p className="text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em] mb-1">
                    Status
                  </p>
                  <p className="text-xl font-black text-emerald-500 uppercase tracking-tighter">
                    Active
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
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

            <section className="relative overflow-hidden rounded-[2.5rem] border border-grey-blue-leaf/10 bg-white shadow-2xl shadow-grey-blue-leaf/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="border-b border-grey-blue-leaf/10 bg-blue-popsicle px-8 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {t.dailySchedule}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">
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
                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-grey-blue-leaf/50">
                          <th className="px-8 py-6">Time Slot</th>
                          <th className="px-8 py-6">Patient Information</th>
                          <th className="px-8 py-6 text-center">Status</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {todays.map((a) => (
                          <tr
                            key={a._id}
                            className="group transition-all hover:bg-slate-50/80"
                          >
                            <td className="whitespace-nowrap px-8 py-6 text-base font-black text-blue-popsicle">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-popsicle/5 text-blue-popsicle">
                                  <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                {a.slot}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-lg font-black text-blue-popsicle tracking-tight">
                                  {a.patientId?.name || "Anonymous Patient"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-grey-blue-leaf/50 tracking-tight">
                                    {a.patientId?.email || "No contact info"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span
                                className={`inline-flex items-center rounded-xl border px-4 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusStyles(a.status)}`}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-3">
                                {a.status === "pending" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(a._id, "confirmed")
                                    }
                                    className="rounded-xl bg-redline px-6 py-2 text-xs font-black text-white shadow-lg shadow-redline/20 transition-all hover:bg-redline/90 active:scale-95"
                                  >
                                    {t.confirmBtn}
                                  </button>
                                )}
                                {a.status === "confirmed" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(a._id, "completed")
                                    }
                                    className="rounded-xl bg-emerald-500 px-6 py-2 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
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
                                    className="rounded-xl border-2 border-slate-100 bg-white px-6 py-2 text-xs font-black text-slate-400 transition-all hover:bg-slate-50 hover:text-redline hover:border-redline/20 active:scale-95"
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
          </main>
        </div>

        <Modal
          open={modalOpen}
          title={t.editAvailability}
          onClose={() => setModalOpen(false)}
        >
          <div className="min-h-0 space-y-6 py-2">
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
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Your profile
                </h4>
                <p className="text-sm text-slate-500">
                  Keep your specialty, experience, fee, and languages current.
                </p>
              </div>

              {availabilityLoading ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-3xl bg-white/60 p-8 text-sm text-slate-500">
                  Loading your doctor profile...
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Specialty
                      <select
                        value={profileForm.specialty}
                        onChange={(e) =>
                          handleProfileChange("specialty", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">Select specialty</option>
                        {SPECIALTIES.map((specialty) => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Experience (years)
                      <input
                        type="number"
                        min="0"
                        value={profileForm.experience}
                        onChange={(e) =>
                          handleProfileChange("experience", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Consultation Fee (₹)
                      <input
                        type="number"
                        min="0"
                        value={profileForm.consultationFee}
                        onChange={(e) =>
                          handleProfileChange("consultationFee", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Languages
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {LANGUAGES.map((language) => (
                        <label
                          key={language}
                          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={profileForm.languages.includes(language)}
                            onChange={() => toggleProfileLanguage(language)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {language}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={savingProfile || availabilityLoading}
                    className="inline-flex items-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              )}
            </div>

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
                      className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1.2fr_1.5fr_1.5fr_1fr_1fr_auto]"
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
                        Clinic Name
                        <input
                          type="text"
                          placeholder="e.g. City Clinic"
                          value={slot.clinicName}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              "clinicName",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Location
                        <input
                          type="text"
                          placeholder="Area or Address"
                          value={slot.location}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              index,
                              "location",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
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

            <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
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
