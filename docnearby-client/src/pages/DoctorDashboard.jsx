import { useEffect, useState, useCallback } from "react";
import SEO from "../components/common/SEO.jsx";
import { appointmentApi, doctorApi, clinicApi } from "../services/api.js";
import { LANGUAGES, SPECIALTIES } from "../utils/constants.js";
import translations from "../utils/i18n.js";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { DashboardStatCard, DashboardWidget } from "../components/dashboard/DashboardComponents.jsx";

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
      
      const apptList = Array.isArray(apptRes) ? apptRes : (apptRes?.appointments ?? []);
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
  const todays = appointments
    .filter((a) => a.date && new Date(a.date).toISOString().slice(0, 10) === todayStr)
    .sort((a, b) => a.slot?.localeCompare(b.slot ?? ""));

  const stats = {
    bookings: appointments.length,
    today: todays.length,
    revenue: appointments.filter(a => a.status === 'completed').length * (doctor?.consultationFee || 500),
    rating: 4.8
  };

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

  const renderAnalytics = () => (
    <div className="space-y-8 animate-in zoom-in-95 duration-700" role="tabpanel" aria-labelledby="tab-analytics">
      <div className="grid md:grid-cols-2 gap-8">
        <DashboardWidget title="Volume Trends" subtitle="Consultation volume over the last 30 days">
           <div className="h-64 bg-slate-50 rounded-3xl flex items-end justify-between p-6 gap-2" role="img" aria-label="Bar chart showing consultation volume trends">
             {[40, 70, 45, 90, 65, 80, 50, 95, 75, 60, 85, 55].map((h, i) => (
               <div key={i} className="flex-1 bg-primary/20 rounded-t-lg hover:bg-primary transition-all group relative" style={{ height: `${h}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{(h*0.5).toFixed(0)}</div>
               </div>
             ))}
           </div>
        </DashboardWidget>
        <DashboardWidget title="Patient Satisfaction" subtitle="Aggregated feedback metrics">
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-secondary">Average Rating</span>
                <span className="text-2xl font-black text-primary" aria-label="4.92 out of 5 stars">4.92/5.0</span>
              </div>
              <div className="space-y-3">
                {['Accuracy', 'Punctuality', 'Communication'].map(metric => (
                  <div key={metric} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                      <span>{metric}</span>
                      <span>98%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow="98" aria-valuemin="0" aria-valuemax="100">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </DashboardWidget>
      </div>
    </div>
  );

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
