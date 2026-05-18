import { useEffect, useState, useCallback, useMemo } from "react";
import SEO from "../components/common/SEO.jsx";
import { appointmentApi, doctorApi, clinicApi } from "../services/api.js";
import { LANGUAGES, SPECIALTIES } from "../utils/constants.js";
import translations from "../utils/i18n.js";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { DashboardStatCard, DashboardWidget } from "../components/dashboard/DashboardComponents.jsx";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function DoctorDashboard() {
  const [lang] = useState(() => localStorage.getItem("dn_lang") || "en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [profileForm, setProfileForm] = useState({
    specialty: "",
    experience: "",
    consultationFee: "",
    languages: [],
    clinicId: "",
  });
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const t = translations[lang];

  const loadData = useCallback(async () => {
    // Defer loading state to avoid cascading render warning
    Promise.resolve().then(() => setLoading(true));
    try {
      const [apptRes, doctorRes, clinicRes] = await Promise.all([
        appointmentApi.doctor(),
        doctorApi.me(),
        clinicApi.list()
      ]);
      
      const apptList = apptRes?.data?.appointments || (Array.isArray(apptRes) ? apptRes : []);
      setAppointments(apptList);
      
      const docData = doctorRes.data?.doctor || null;
      setDoctor(docData);

      const clinicList = clinicRes.success ? (clinicRes.data?.clinics || []) : [];
      setClinics(clinicList);

      if (docData) {
        setProfileForm({
          specialty: docData.specialty || "",
          experience: docData.experience != null ? String(docData.experience) : "",
          consultationFee: docData.consultationFee != null ? String(docData.consultationFee) : "",
          languages: docData.languages || [],
          clinicId: docData.clinicId?._id || docData.clinicId || "",
        });
        
        const initialRows = (docData.availableSlots || []).map((slot) => ({
          day: slot.day || "Mon",
          startTime: slot.startTime || "09:00",
          endTime: slot.endTime || "17:00",
          slotDuration: slot.slotDuration || 30,
          clinicName: slot.clinicName || "",
          location: slot.location || "",
        }));
        setAvailabilityRows(initialRows.length ? initialRows : [{ day: "Mon", startTime: "09:00", endTime: "17:00", slotDuration: 30, clinicName: "", location: "" }]);
      }
    } catch (e) {
      setError("Failed to synchronize clinical data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todays = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments
      .filter((a) => a && a.date && new Date(a.date).toISOString().slice(0, 10) === todayStr)
      .sort((a, b) => a.slot?.localeCompare(b.slot ?? ""));
  }, [appointments, todayStr]);

  const stats = useMemo(() => {
    const totalCount = Array.isArray(appointments) ? appointments.length : 0;
    const completedCount = Array.isArray(appointments) 
      ? appointments.filter(a => a && a.status === 'completed').length 
      : 0;
    const fee = Number(doctor?.consultationFee) || 500;
    
    return {
      bookings: totalCount,
      today: todays.length,
      revenue: completedCount * fee,
      rating: 4.8
    };
  }, [appointments, todays, doctor]);

  // Group completed appointments by month for revenue chart
  const revenueData = useMemo(() => {
    if (!Array.isArray(appointments) || appointments.length === 0) return [];
    
    const fee = Number(doctor?.consultationFee) || 500;
    const monthlyMap = {};

    const completedList = appointments.filter(a => a && a.status === "completed");
    
    completedList.forEach(appt => {
      if (!appt || !appt.date) return;
      const dateObj = new Date(appt.date);
      if (isNaN(dateObj.getTime())) return;
      
      const key = dateObj.toLocaleString("en-US", { month: "short", year: "numeric" });
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          name: key,
          revenue: 0,
          count: 0,
          dateObj: dateObj
        };
      }
      monthlyMap[key].revenue += fee;
      monthlyMap[key].count += 1;
    });

    return Object.values(monthlyMap)
      .sort((a, b) => a.dateObj - b.dateObj)
      .map(({ name, revenue, count }) => ({ name, revenue, count }));
  }, [appointments, doctor]);

  // Count appointments by status for status chart
  const statusData = useMemo(() => {
    if (!Array.isArray(appointments) || appointments.length === 0) return [];
    
    const counts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    appointments.forEach(a => {
      if (!a) return;
      const status = a.status || "pending";
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return [
      { name: "Pending", value: counts.pending, color: "#F59E0B" },
      { name: "Confirmed", value: counts.confirmed, color: "#10B981" },
      { name: "Completed", value: counts.completed, color: "#0F6CBD" },
      { name: "Cancelled", value: counts.cancelled, color: "#EF4444" }
    ].filter(item => item.value > 0);
  }, [appointments]);

  // Completed consultation statistics
  const analyticsStats = useMemo(() => {
    const stats = {
      completedCount: 0,
      totalRevenue: 0,
      avgFee: Number(doctor?.consultationFee) || 500,
      completionRate: 0
    };

    if (!Array.isArray(appointments) || appointments.length === 0) return stats;

    const totalCount = appointments.length;
    const completedList = appointments.filter(a => a && a.status === "completed");
    stats.completedCount = completedList.length;
    stats.totalRevenue = stats.completedCount * stats.avgFee;
    stats.completionRate = totalCount > 0 ? Math.round((stats.completedCount / totalCount) * 100) : 0;

    return stats;
  }, [appointments, doctor]);

  const menuItems = [
    { id: 'schedule', label: 'Daily Schedule', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, active: activeTab === 'schedule', onClick: () => setActiveTab('schedule') },
    { id: 'patients', label: 'Patient Roster', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, active: activeTab === 'patients', onClick: () => setActiveTab('patients') },
    { id: 'analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, active: activeTab === 'analytics', onClick: () => setActiveTab('analytics') },
    { id: 'availability', label: 'Availability Settings', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, active: activeTab === 'availability', onClick: () => setActiveTab('availability') },
  ];

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentApi.updateStatus(id, status);
      loadData();
      setToast(`Consultation marked as ${status}`);
      setToastType("success");
    } catch (e) {
      setToast("Failed to update status");
      setToastType("error");
    }
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    setAvailabilityError("");
    try {
      const payload = { availableSlots: availabilityRows };
      await doctorApi.updateAvailability(doctor._id, payload);
      setToast("Availability protocol updated");
      setToastType("success");
      loadData();
    } catch (e) {
      setAvailabilityError(e?.response?.data?.message || "Protocol update failed");
      setToastType("error");
    } finally {
      setSavingAvailability(false);
    }
  };

  const renderSchedule = () => (
    <div className="space-y-6 animate-in fade-in duration-500" role="tabpanel" aria-labelledby="tab-schedule">
      <DashboardWidget 
        title="Today's Clinical Lineup" 
        subtitle={`${todays.length} confirmed encounters for ${todayStr}`}
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      >
        <div className="overflow-x-auto">
          {todays.length === 0 ? (
            <div className="py-20 text-center text-medical-text-light font-bold uppercase tracking-widest text-xs" role="status">No clinical encounters scheduled for today.</div>
          ) : (
            <table className="w-full text-left" aria-label="Today's patient appointments">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light" scope="col">Slot</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light" scope="col">Patient Entity</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light" scope="col">Status</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light text-right" scope="col">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todays.map(a => (
                  <tr key={a._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-black text-secondary">{a.slot}</td>
                    <td className="py-4">
                      <div className="font-extrabold text-secondary">{a.patientId?.name || "Verified Patient"}</div>
                      <div className="text-[10px] font-bold text-medical-text-light uppercase tracking-tight">{a.patientId?.email}</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        a.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                        a.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                      }`} aria-label={`Appointment status: ${a.status}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {a.status === 'pending' && <button onClick={() => handleStatusUpdate(a._id, 'confirmed')} className="px-3 py-1.5 rounded-xl bg-primary text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-primary/20 focus-visible:ring-offset-2" aria-label={`Confirm appointment for ${a.patientId?.name || 'patient'}`}>Confirm</button>}
                        {a.status === 'confirmed' && <button onClick={() => handleStatusUpdate(a._id, 'completed')} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-200 focus-visible:ring-offset-2" aria-label={`Mark appointment for ${a.patientId?.name || 'patient'} as completed`}>Complete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardWidget>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700" role="tabpanel" aria-labelledby="tab-availability">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <DashboardWidget 
          title="Slot Configuration" 
          subtitle="Define your clinical presence and consultation windows"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
          action={<button onClick={saveAvailability} disabled={savingAvailability} className="btn-primary !py-2 !text-[10px] focus-visible:ring-offset-2">{savingAvailability ? "Syncing..." : "Publish Slots"}</button>}
        >
          <div className="space-y-4" role="list" aria-label="Available slot windows">
            {availabilityRows.map((row, i) => (
              <div key={i} role="listitem" className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 relative group focus-within:ring-2 focus-within:ring-primary outline-none">
                <div className="space-y-1">
                  <label htmlFor={`day-${i}`} className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Day</label>
                  <select id={`day-${i}`} value={row.day} onChange={(e) => { const next = [...availabilityRows]; next[i].day = e.target.value; setAvailabilityRows(next); }} className="medical-input !py-2 !text-xs focus:ring-primary">
                    {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`clinic-${i}`} className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Clinic</label>
                  <input id={`clinic-${i}`} type="text" value={row.clinicName} onChange={(e) => { const next = [...availabilityRows]; next[i].clinicName = e.target.value; setAvailabilityRows(next); }} className="medical-input !py-2 !text-xs focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`loc-${i}`} className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Location</label>
                  <input id={`loc-${i}`} type="text" value={row.location} onChange={(e) => { const next = [...availabilityRows]; next[i].location = e.target.value; setAvailabilityRows(next); }} className="medical-input !py-2 !text-xs focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`start-${i}`} className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Start</label>
                  <input id={`start-${i}`} type="time" value={row.startTime} onChange={(e) => { const next = [...availabilityRows]; next[i].startTime = e.target.value; setAvailabilityRows(next); }} className="medical-input !py-2 !text-xs focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`end-${i}`} className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">End</label>
                  <input id={`end-${i}`} type="time" value={row.endTime} onChange={(e) => { const next = [...availabilityRows]; next[i].endTime = e.target.value; setAvailabilityRows(next); }} className="medical-input !py-2 !text-xs focus:ring-primary" />
                </div>
                <button onClick={() => setAvailabilityRows(availabilityRows.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity border border-rose-100 shadow-sm focus:outline-none" aria-label="Remove slot window">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => setAvailabilityRows([...availabilityRows, { day: "Mon", startTime: "09:00", endTime: "17:00", slotDuration: 30, clinicName: "", location: "" }])} className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-100 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-slate-50 transition-all focus:ring-2 focus:ring-primary outline-none">+ Add Consultation Window</button>
          </div>
        </DashboardWidget>

        <div className="space-y-6">
          <DashboardWidget title="Clinical Profile" subtitle="Your credentials and fees">
             <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
               <div className="space-y-1">
                 <label htmlFor="prof-specialty" className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Specialty</label>
                 <select id="prof-specialty" value={profileForm.specialty} onChange={(e) => setProfileForm({...profileForm, specialty: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary">
                   {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div className="space-y-1">
                 <label htmlFor="prof-clinic" className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Clinic Affiliation</label>
                 <select id="prof-clinic" value={profileForm.clinicId || ""} onChange={(e) => setProfileForm({...profileForm, clinicId: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary">
                   <option value="">Independent / None</option>
                   {clinics.map(c => (
                     <option key={c._id} value={c._id}>{c.name} ({c.city})</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-1">
                 <label htmlFor="prof-fee" className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Consultation Fee (₹)</label>
                 <input id="prof-fee" type="number" value={profileForm.consultationFee} onChange={(e) => setProfileForm({...profileForm, consultationFee: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
               </div>
               <button onClick={async () => {
                 setSavingProfile(true);
                 try { 
                   await doctorApi.update(doctor._id, profileForm); 
                   setToast("Profile synchronized"); 
                   setToastType("success");
                 } catch(e) { 
                   setToast("Sync failed"); 
                   setToastType("error");
                 } finally { 
                   setSavingProfile(false); 
                 }
               }} disabled={savingProfile} className="btn-primary w-full !py-3 !text-[10px] uppercase focus-visible:ring-offset-2">{savingProfile ? "Syncing..." : "Update Professional Data"}</button>
             </form>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    if (!Array.isArray(appointments) || appointments.length === 0) {
      return (
        <div className="space-y-8 animate-in zoom-in-95 duration-700" role="tabpanel" aria-labelledby="tab-analytics">
          <div className="medical-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-primary mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight mb-2">No Analytics Data Available</h3>
            <p className="text-xs font-semibold text-medical-text-light max-w-sm uppercase tracking-wide">
              Once you start receiving clinical bookings and completing consultations, your revenue and volume statistics will appear here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-700" role="tabpanel" aria-labelledby="tab-analytics">
        {/* Analytics mini summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Completed Visits</p>
              <p className="text-2xl font-black text-secondary">{analyticsStats.completedCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              ₹
            </div>
            <div>
              <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Completed Earnings</p>
              <p className="text-2xl font-black text-secondary">₹{analyticsStats.totalRevenue}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              %
            </div>
            <div>
              <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Completion Rate</p>
              <p className="text-2xl font-black text-secondary">{analyticsStats.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <DashboardWidget title="Revenue Trends" subtitle="Clinical revenue over time from completed visits" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            {revenueData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-xs font-black text-medical-text-light uppercase tracking-widest mb-1">No Completed Consultations</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Complete appointments to start tracking revenue history.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "12px", color: "#FFFFFF" }}
                      labelStyle={{ fontWeight: "black", textTransform: "uppercase", fontSize: "10px", color: "#9CA3AF" }}
                      itemStyle={{ color: "#FFFFFF", fontWeight: "bold", fontSize: "12px" }}
                      formatter={(value) => [`₹${value}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0F6CBD" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget title="Appointment Analytics" subtitle="Status distribution breakdown" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}>
            <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-44 w-44 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "12px", color: "#FFFFFF" }}
                      itemStyle={{ color: "#FFFFFF", fontWeight: "bold", fontSize: "12px" }}
                      formatter={(value) => [value, "Appointments"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-secondary">{appointments.length}</span>
                  <span className="text-[9px] font-black text-medical-text-light uppercase tracking-widest">Total</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-[200px]" role="region" aria-label="Chart legend">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="font-extrabold text-secondary">{entry.name}</span>
                    </div>
                    <span className="font-black text-medical-text-light">{entry.value} ({Math.round((entry.value / appointments.length) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout 
      title="Clinician HQ" 
      subtitle={`Welcome back, Dr. ${doctor?.userId?.name || 'Clinician'}. You have ${todays.length} patients scheduled for today.`}
      menuItems={menuItems}
    >
      <SEO 
        title="Clinician Dashboard"
        description="Manage your clinical schedule, patient appointments, and professional profile."
      />
      
      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6" role="region" aria-label="Clinical metrics summary">
          <DashboardStatCard title="Confirmed Cases" value={stats.bookings} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} color="primary" trend={14} />
          <DashboardStatCard title="Daily Queue" value={stats.today} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="info" />
          <DashboardStatCard title="Estimated Revenue" value={`₹${stats.revenue}`} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="success" trend={8} />
          <DashboardStatCard title="Clinical Trust" value={stats.rating} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} color="warning" />
        </div>

        {error && <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm" role="alert">{error}</div>}

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 medical-card animate-pulse" aria-busy="true">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" aria-hidden="true" />
            <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">Accessing clinical database</p>
          </div>
        ) : (
          <div className="focus:outline-none">
            {activeTab === 'schedule' && renderSchedule()}
            {activeTab === 'availability' && renderAvailability()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'patients' && (
              <DashboardWidget title="Patient Roster" subtitle="Historical patient database and interaction logs">
                <div className="py-20 text-center text-medical-text-light font-bold uppercase tracking-widest text-xs" role="status">Roster synchronization in progress...</div>
              </DashboardWidget>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div 
          className={`fixed bottom-10 right-10 p-5 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 flex items-center gap-4 z-50 ${
            toastType === 'success' ? 'bg-secondary text-white' : 'bg-rose-600 text-white'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black" aria-hidden="true">!</div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-60">System Notification</p>
            <p className="font-bold">{toast}</p>
          </div>
          <button onClick={() => setToast('')} className="ml-4 opacity-40 hover:opacity-100 transition-opacity focus:outline-none" aria-label="Close notification">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
