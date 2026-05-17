import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../components/appointment/AppointmentCard.jsx";
import Modal from "../components/common/Modal.jsx";
import SEO from "../components/common/SEO.jsx";
import { appointmentApi } from "../services/api.js";
import translations from "../utils/i18n.js";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { DashboardStatCard, DashboardWidget, DashboardTabs } from "../components/dashboard/DashboardComponents.jsx";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [lang] = useState(() => localStorage.getItem("dn_lang") || "en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentSubTab, setAppointmentSubTab] = useState("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);


  const loadAppointments = useCallback(async () => {
    // Defer loading state to avoid cascading render warning
    Promise.resolve().then(() => setLoading(true));
    try {
      const res = await appointmentApi.patient();
      const list = res?.data?.appointments || (Array.isArray(res) ? res : []);
      setAppointments(list);
    } catch (e) {
      setError(e?.message || "Failed to load clinical data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const now = new Date();
  const toDateTime = (a) => {
    const dateStr = new Date(a.date).toISOString().slice(0, 10);
    const [time, meridiem] = (a.slot || "").split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  };

  const upcoming = appointments.filter((a) => a.status !== "cancelled" && toDateTime(a) > now);
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled" || toDateTime(a) <= now);

  const stats = {
    total: appointments.length,
    upcoming: upcoming.length,
    records: 12, // Mock count for reports + prescriptions
  };

  const menuItems = [
    { 
      id: 'appointments', 
      label: 'Clinical Visits', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, 
      active: activeTab === 'appointments',
      onClick: () => setActiveTab('appointments')
    },
    { 
      id: 'records', 
      label: 'Health Records', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
      active: activeTab === 'records',
      onClick: () => setActiveTab('records')
    },
    { 
      id: 'care-team', 
      label: 'My Care Team', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, 
      active: activeTab === 'care-team',
      onClick: () => setActiveTab('care-team')
    }
  ];

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setLoading(true);
      await appointmentApi.updateStatus(cancelTarget._id, "cancelled");
      loadAppointments();
    } catch (e) {
      console.error("Cancel failed", e);
    } finally {
      setModalOpen(false);
      setCancelTarget(null);
    }
  };

  const renderAppointments = () => (
    <div className="space-y-6 animate-in fade-in duration-500" role="tabpanel" aria-labelledby="tab-appointments">
      <DashboardTabs 
        tabs={[
          { id: 'upcoming', label: 'Upcoming Consultations' },
          { id: 'past', label: 'Past History' }
        ]} 
        activeTab={appointmentSubTab} 
        onChange={setAppointmentSubTab} 
      />
      
      <DashboardWidget 
        title={appointmentSubTab === 'upcoming' ? 'Upcoming Visits' : 'Consultation History'}
        subtitle="Manage your clinical schedule and visit history"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        action={
          <button onClick={() => navigate('/search')} className="btn-primary !text-xs !py-2.5 focus-visible:ring-offset-2">
            Book New Consultation
          </button>
        }
      >
        <div className="space-y-4" role="list">
          {(appointmentSubTab === 'upcoming' ? upcoming : past).length === 0 ? (
            <div className="py-20 text-center" role="status">
              <p className="text-medical-text-light font-bold">No clinical visits recorded in this category.</p>
            </div>
          ) : (
            (appointmentSubTab === 'upcoming' ? upcoming : past).map((appt) => (
              <div key={appt._id} role="listitem" className="border border-slate-50 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-primary outline-none">
                <AppointmentCard 
                  appt={appt} 
                  onCancel={appt.status === 'pending' || appt.status === 'confirmed' ? () => { setCancelTarget(appt); setModalOpen(true); } : undefined} 
                />
              </div>
            ))
          )}
        </div>
      </DashboardWidget>
    </div>
  );

  const renderHealthRecords = () => (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-700" role="tabpanel" aria-labelledby="tab-records">
      <div className="grid md:grid-cols-2 gap-8">
        <DashboardWidget 
          title="Diagnostic Reports" 
          subtitle="Recent laboratory and radiology results"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
        >
          <div className="space-y-4" role="list">
            {[1, 2].map((i) => (
              <div key={i} role="listitem" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all focus-within:ring-2 focus-within:ring-primary outline-none">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black" aria-hidden="true">PDF</div>
                  <div>
                    <p className="text-sm font-black text-secondary">Blood Panel - Comprehensive</p>
                    <p className="text-[10px] font-bold text-medical-text-light uppercase tracking-widest">Oct 12, 2023 • Apollo Diagnostics</p>
                  </div>
                </div>
                <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors focus:outline-none" aria-label="Download Diagnostic Report">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            ))}
            <button className="w-full py-3 text-xs font-black text-primary uppercase tracking-widest hover:underline text-center focus:outline-none">View All Diagnostic History</button>
          </div>
        </DashboardWidget>

        <DashboardWidget 
          title="Digital Prescriptions" 
          subtitle="Medication orders from your clinicians"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        >
          <div className="space-y-4" role="list">
            {[1, 2].map((i) => (
              <div key={i} role="listitem" tabIndex="0" className="p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all cursor-pointer group focus:ring-2 focus:ring-primary outline-none">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-black text-secondary">Anti-Allergy Course</h4>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase tracking-widest">Active</span>
                </div>
                <p className="text-xs font-medium text-medical-text-light">Dr. Sarah Connor • 15 Day Course</p>
                <div className="mt-3 flex gap-2">
                   <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cetirizine 10mg</div>
                   <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">1-0-1</div>
                </div>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );

  const renderCareTeam = () => (
    <div className="animate-in slide-in-from-bottom-10 duration-700" role="tabpanel" aria-labelledby="tab-care-team">
      <DashboardWidget 
        title="My Care Team" 
        subtitle="Clinicians you've consulted with or saved"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
          {[1, 2, 3].map((i) => (
            <div key={i} role="listitem" className="medical-card p-6 flex flex-col items-center text-center group hover:border-primary transition-all focus-within:ring-2 focus-within:ring-primary outline-none">
              <div className="w-16 h-16 rounded-full bg-slate-100 mb-4 overflow-hidden" aria-hidden="true">
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">D</div>
              </div>
              <h4 className="font-black text-secondary group-hover:text-primary transition-colors">Dr. Michael Chen</h4>
              <p className="text-[10px] font-bold text-medical-text-light uppercase tracking-widest mt-1">Senior Cardiologist</p>
              <div className="mt-4 flex items-center gap-2">
                <button className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-secondary uppercase tracking-widest hover:bg-slate-100 transition-colors focus:outline-none">Profile</button>
                <button onClick={() => navigate('/book/1')} className="px-4 py-2 rounded-xl bg-primary text-[10px] font-black text-white uppercase tracking-widest hover:bg-primary-dark transition-all focus:outline-none">Book</button>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/search')} className="medical-card border-dashed p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-all gap-4 focus:ring-2 focus:ring-primary outline-none">
             <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300" aria-hidden="true">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             </div>
             <div>
               <p className="text-sm font-black text-secondary">Find a New Specialist</p>
               <p className="text-xs font-bold text-medical-text-light mt-1">Expand your clinical care team</p>
             </div>
          </button>
        </div>
      </DashboardWidget>
    </div>
  );

  return (
    <DashboardLayout 
      title="Personal Health HQ" 
      subtitle={`Welcome back, Patient. You have ${upcoming.length} upcoming clinical encounters.`}
      menuItems={menuItems}
    >
      <SEO 
        title="Patient Dashboard"
        description="Manage your clinical appointments, health records, and care team in one secure place."
      />
      
      <div className="space-y-10">
        {/* Universal Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" role="region" aria-label="Health statistics summary">
          <DashboardStatCard 
            title="Active Consultations" 
            value={stats.upcoming} 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            color="primary"
          />
          <DashboardStatCard 
            title="Clinical History" 
            value={stats.total} 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            color="info"
          />
          <DashboardStatCard 
            title="Digital Health Assets" 
            value={stats.records} 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
            color="success"
            trend={12}
          />
        </div>

        {error && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm animate-in shake-in duration-500" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 medical-card animate-pulse" aria-busy="true">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" aria-hidden="true" />
            <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">Synchronizing clinical data</p>
          </div>
        ) : (
          <div className="focus:outline-none">
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'records' && renderHealthRecords()}
            {activeTab === 'care-team' && renderCareTeam()}
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="Reschedule or Cancel Visit" onClose={() => setModalOpen(false)}>
        <div className="space-y-6 py-4">
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Are you sure you want to cancel this clinical consultation? This action will release the slot to other patients.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button className="px-6 py-3 rounded-2xl border border-slate-100 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all focus:outline-none" onClick={() => setModalOpen(false)}>Keep Appointment</button>
            <button className="px-6 py-3 rounded-2xl bg-rose-600 text-sm font-black text-white shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 focus:outline-none" onClick={confirmCancel}>Cancel Consultation</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
