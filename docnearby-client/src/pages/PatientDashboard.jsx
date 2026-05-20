import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import AppointmentCard from "../components/appointment/AppointmentCard.jsx";
import SlotPicker from "../components/appointment/SlotPicker.jsx";
import CalendarPicker from "../components/appointment/CalendarPicker.jsx";
import Modal from "../components/common/Modal.jsx";
import SEO from "../components/common/SEO.jsx";

import {
  appointmentApi,
  prescriptionApi,
  medicalRecordApi,
  authApi,
  doctorApi
} from "../services/api.js";

import {
  isUpcoming,
  isPast,
  isCancellable
} from "../utils/appointmentUtils.js";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import {
  DashboardStatCard,
  DashboardWidget,
  DashboardTabs
} from "../components/dashboard/DashboardComponents.jsx";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentSubTab, setAppointmentSubTab] = useState("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Reschedule state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDoctor, setRescheduleDoctor] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [loadingDoctorData, setLoadingDoctorData] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotInfo, setSlotInfo] = useState({ available: [], booked: [], isBlocked: false });
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [rxModalOpen, setRxModalOpen] = useState(false);

  // Medical Records pagination & state
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [profileForm, setProfileForm] = useState({
    dob: "",
    gender: "",
    bloodGroup: "",
    allergies: "",
    chronicConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await authApi.me();
        const profile = res?.data?.user?.patientProfile;
        if (profile) {
          setProfileForm({
            dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : "",
            gender: profile.gender || "",
            bloodGroup: profile.bloodGroup || "",
            allergies: profile.allergies ? profile.allergies.join(", ") : "",
            chronicConditions: profile.chronicConditions ? profile.chronicConditions.join(", ") : "",
            emergencyContactName: profile.emergencyContact?.name || "",
            emergencyContactPhone: profile.emergencyContact?.phone || "",
            emergencyContactRelation: profile.emergencyContact?.relation || ""
          });
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await medicalRecordApi.patient({ page: recordsPage, limit: 5 });
        setMedicalRecords(res?.data?.records || []);
        setRecordsTotalPages(res?.data?.pagination?.pages || 1);
      } catch (e) {
        console.error("Failed to load medical records", e);
      }
    }
    loadRecords();
  }, [recordsPage]);


  const loadAppointments = useCallback(async (showLoading = true) => {
    // Defer loading state to avoid cascading render warning
    if (showLoading) Promise.resolve().then(() => setLoading(true));
    try {
      const [apptRes] = await Promise.all([
        appointmentApi.patient(),
        prescriptionApi.patient()
      ]);
      const list = apptRes?.data?.appointments || (Array.isArray(apptRes) ? apptRes : []);
      setAppointments(list);
    } catch (e) {
      if (showLoading) setError(e?.message || "Failed to load clinical data");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadAppointments(true);
    }, 0);
    const interval = setInterval(() => {
      loadAppointments(false); // poll silently
    }, 10000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const upcoming = appointments.filter(isUpcoming);
  const past = appointments.filter(isPast);

  const stats = {
    total: appointments.length,
    upcoming: upcoming.length,
    records: medicalRecords.length,
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
    },
    { 
      id: 'profile', 
      label: 'Medical Profile', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, 
      active: activeTab === 'profile',
      onClick: () => setActiveTab('profile')
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

  const handleOpenReschedule = async (appt) => {
    setRescheduleTarget(appt);
    setRescheduleDoctor(null);
    setRescheduleSlot("");
    setRescheduleError("");
    setRescheduleSuccess(false);
    
    let initialDate = "";
    if (appt.date) {
      const d = new Date(appt.date);
      initialDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    setRescheduleDate(initialDate);
    setRescheduleModalOpen(true);
    setLoadingDoctorData(true);
    
    try {
      const docId = appt.doctorId?._id || appt.doctorId;
      const res = await doctorApi.get(docId);
      const doctorData = res?.data?.doctor || res?.data || null;
      setRescheduleDoctor(doctorData);
    } catch (e) {
      setRescheduleError("Failed to load doctor availability profile.");
      console.error(e);
    } finally {
      setLoadingDoctorData(false);
    }
  };

  useEffect(() => {
    if (!rescheduleDoctor || !rescheduleDate) return;
    
    let cancelled = false;
    async function loadSlots() {
      setLoadingSlots(true);
      setRescheduleError("");
      try {
        const docId = rescheduleDoctor._id || rescheduleDoctor.id;
        const res = await doctorApi.slots(docId, rescheduleDate);
        const nextAvailable = res?.data?.available || [];
        const nextBooked = res?.data?.booked || [];
        const isBlocked = res?.data?.isBlocked || false;
        
        if (!cancelled) {
          setSlotInfo({ available: nextAvailable, booked: nextBooked, isBlocked });
          setRescheduleSlot(prev => nextAvailable.includes(prev) ? prev : "");
        }
      } catch (e) {
        if (!cancelled) setRescheduleError(e?.message || "Failed to load available slots.");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [rescheduleDoctor, rescheduleDate]);

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleSlot) {
      setRescheduleError("Please select a valid date and time slot.");
      return;
    }
    
    setRescheduleSubmitting(true);
    setRescheduleError("");
    try {
      await appointmentApi.reschedule(rescheduleTarget._id, {
        date: rescheduleDate,
        slot: rescheduleSlot,
      });
      setRescheduleSuccess(true);
      setTimeout(() => {
        setRescheduleModalOpen(false);
        setRescheduleTarget(null);
        setRescheduleDoctor(null);
        setRescheduleDate("");
        setRescheduleSlot("");
        setRescheduleSuccess(false);
        loadAppointments(true);
      }, 1500);
    } catch (e) {
      setRescheduleError(e?.response?.data?.message || e?.message || "Failed to reschedule appointment.");
    } finally {
      setRescheduleSubmitting(false);
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
                  onCancel={isCancellable(appt) ? () => { setCancelTarget(appt); setModalOpen(true); } : undefined} 
                  onReschedule={isCancellable(appt) ? () => handleOpenReschedule(appt) : undefined}
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
      <div className="grid gap-8">
        <DashboardWidget 
          title="Clinical History & Medical Records" 
          subtitle="Medication orders, diagnosis history, and clinical documentation"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        >
          <div className="space-y-4" role="list">
            {medicalRecords.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">No Medical Records</h4>
                <p className="text-xs text-slate-400 mt-2 font-medium max-w-xs">You don't have any shared prescriptions or medical records yet.</p>
              </div>
            ) : (
              medicalRecords.map((rx) => (
                <div 
                  key={rx._id} 
                  role="button" 
                  tabIndex="0" 
                  onClick={() => { setSelectedRx(rx); setRxModalOpen(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedRx(rx); setRxModalOpen(true); } }}
                  className="p-5 rounded-3xl border border-slate-100 bg-white hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group focus:ring-2 focus:ring-primary outline-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-black text-secondary text-base group-hover:text-primary transition-colors">
                        {rx.diagnosis || "Consultation Record"}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {rx.appointmentId?.date ? new Date(rx.appointmentId.date).toLocaleDateString() : 'Date unavailable'}
                      </p>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">
                      Prescription
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                      {rx.doctorId?.userId?.name?.charAt(0) || "D"}
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      Dr. {rx.doctorId?.userId?.name || "Clinician"} <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400 font-medium">{rx.doctorId?.specialty || "Specialist"}</span>
                    </p>
                  </div>
                  
                  {/* Extensible attachment info */}
                  {rx.pdfs && rx.pdfs.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <span>{rx.pdfs.length} PDF Document{rx.pdfs.length > 1 ? 's' : ''} Attached</span>
                    </div>
                  )}

                  {rx.medicines && rx.medicines.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rx.medicines.slice(0, 3).map((med, idx) => (
                        <div key={idx} className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {med.name}
                        </div>
                      ))}
                      {rx.medicines.length > 3 && (
                        <div className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-tighter">
                          +{rx.medicines.length - 3} More
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {recordsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button
                  disabled={recordsPage === 1}
                  onClick={() => setRecordsPage(recordsPage - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Page {recordsPage} of {recordsTotalPages}
                </span>
                <button
                  disabled={recordsPage === recordsTotalPages}
                  onClick={() => setRecordsPage(recordsPage + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );

  const renderCareTeam = () => {
    const uniqueDoctorsMap = new Map();
    appointments.forEach(appt => {
      const doc = appt.doctorId;
      if (doc && doc._id && !uniqueDoctorsMap.has(doc._id)) {
        uniqueDoctorsMap.set(doc._id, doc);
      }
    });
    const careTeam = Array.from(uniqueDoctorsMap.values());

    return (
    <div className="animate-in slide-in-from-bottom-10 duration-700" role="tabpanel" aria-labelledby="tab-care-team">
      <DashboardWidget 
        title="My Care Team" 
        subtitle="Clinicians you've consulted with or saved"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
          {careTeam.map((doc) => (
            <div key={doc._id} role="listitem" className="medical-card p-6 flex flex-col items-center text-center group hover:border-primary transition-all focus-within:ring-2 focus-within:ring-primary outline-none">
              <div className="w-16 h-16 rounded-full bg-slate-100 mb-4 overflow-hidden" aria-hidden="true">
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">{doc.userId?.name?.charAt(0) || "D"}</div>
              </div>
              <h4 className="font-black text-secondary group-hover:text-primary transition-colors">Dr. {doc.userId?.name || "Clinician"}</h4>
              <p className="text-[10px] font-bold text-medical-text-light uppercase tracking-widest mt-1">{doc.specialty || "Specialist"}</p>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => navigate(`/book/${doc._id}`)} className="px-4 py-2 rounded-xl bg-primary text-[10px] font-black text-white uppercase tracking-widest hover:bg-primary-dark transition-all focus:outline-none">Book Again</button>
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
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const payload = {
        dob: profileForm.dob || undefined,
        gender: profileForm.gender || undefined,
        bloodGroup: profileForm.bloodGroup || undefined,
        allergies: profileForm.allergies ? profileForm.allergies.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        chronicConditions: profileForm.chronicConditions ? profileForm.chronicConditions.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        emergencyContact: {
          name: profileForm.emergencyContactName,
          phone: profileForm.emergencyContactPhone,
          relation: profileForm.emergencyContactRelation
        }
      };
      await authApi.updateProfile(payload);
      setProfileMessage("Profile updated successfully!");
    } catch {
      setProfileMessage("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const renderProfile = () => (
    <div className="space-y-6 animate-in fade-in duration-500" role="tabpanel" aria-labelledby="tab-profile">
      <DashboardWidget 
        title="Medical Profile" 
        subtitle="Manage your personal and medical information"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
      >
        {profileMessage && (
          <div className={`p-4 mb-4 rounded-xl text-sm font-bold ${profileMessage.includes('success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {profileMessage}
          </div>
        )}
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Date of Birth</label>
              <input type="date" value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Gender</label>
              <select value={profileForm.gender} onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Blood Group</label>
              <select value={profileForm.bloodGroup} onChange={(e) => setProfileForm({...profileForm, bloodGroup: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary">
                <option value="">Select Blood Group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Allergies (comma separated)</label>
              <input type="text" placeholder="e.g. Peanuts, Penicillin" value={profileForm.allergies} onChange={(e) => setProfileForm({...profileForm, allergies: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Chronic Conditions (comma separated)</label>
              <input type="text" placeholder="e.g. Asthma, Diabetes" value={profileForm.chronicConditions} onChange={(e) => setProfileForm({...profileForm, chronicConditions: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
            <div className="space-y-1 md:col-span-2 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-secondary">Emergency Contact</h4>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Name</label>
              <input type="text" value={profileForm.emergencyContactName} onChange={(e) => setProfileForm({...profileForm, emergencyContactName: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Phone</label>
              <input type="tel" value={profileForm.emergencyContactPhone} onChange={(e) => setProfileForm({...profileForm, emergencyContactPhone: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">Relation</label>
              <input type="text" value={profileForm.emergencyContactRelation} onChange={(e) => setProfileForm({...profileForm, emergencyContactRelation: e.target.value})} className="medical-input !py-2.5 !text-xs focus:ring-primary" />
            </div>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary w-full !py-3 !text-[10px] uppercase focus-visible:ring-offset-2">
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
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
            {activeTab === 'profile' && renderProfile()}
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

      <Modal open={rxModalOpen} title="Prescription Details" onClose={() => setRxModalOpen(false)}>
        <div className="space-y-6 py-2">
          {selectedRx && (
            <div className="space-y-6">
              {/* Doctor details banner */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                  {selectedRx.doctorId?.userId?.name?.charAt(0) || "Rx"}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-secondary text-lg">Dr. {selectedRx.doctorId?.userId?.name || "Clinician"}</h4>
                  <p className="text-xs font-bold text-medical-text-light uppercase tracking-widest mt-0.5">{selectedRx.doctorId?.specialty || "Specialist"}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Date</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedRx.appointmentId?.date ? new Date(selectedRx.appointmentId.date).toLocaleDateString() : 'Date unavailable'}
                  </p>
                </div>
              </div>

              {/* Diagnosis banner */}
              <div className="px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diagnosis / Condition</span>
                <p className="font-black text-secondary text-base">{selectedRx.diagnosis || "No diagnosis specified"}</p>
              </div>

              {/* Medicines cards instead of table for better mobile UX */}
              <div className="px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Prescribed Medications</span>
                {selectedRx.medicines && selectedRx.medicines.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedRx.medicines.map((med, index) => (
                      <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                        <h5 className="font-extrabold text-primary text-sm">{med.name}</h5>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-1">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Dosage</span>
                            <span className="text-xs font-bold text-slate-700">{med.dosage || "-"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Frequency</span>
                            <span className="text-xs font-bold text-slate-700">{med.frequency || "-"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Duration</span>
                            <span className="text-xs font-bold text-slate-700">{med.duration || "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400">No medicines prescribed.</p>
                  </div>
                )}
              </div>

              {/* Advice */}
              <div className="px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Clinical Advice</span>
                {selectedRx.advice ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <p className="text-sm font-medium text-emerald-900 whitespace-pre-wrap leading-relaxed">{selectedRx.advice}</p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No specific advice recorded.</p>
                )}
              </div>

              {/* Notes */}
              {selectedRx.notes && (
                <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Additional Notes</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{selectedRx.notes}</p>
                </div>
              )}

              {/* Attached PDFs */}
              {selectedRx.pdfs && selectedRx.pdfs.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50 space-y-2">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Attached Documents</span>
                  <div className="space-y-2">
                    {selectedRx.pdfs.map((pdf, idx) => (
                      <a 
                        key={idx}
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-black text-[10px]">PDF</div>
                          <span className="truncate max-w-[200px]">{pdf.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">Download</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setRxModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-xs font-black text-white uppercase tracking-widest hover:bg-primary-dark transition-all focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={rescheduleModalOpen} title="Reschedule Clinical Visit" onClose={() => { if (!rescheduleSubmitting) setRescheduleModalOpen(false); }}>
        <div className="space-y-6 py-2">
          {rescheduleSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm" aria-hidden="true">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900">Rescheduled Successfully!</h4>
              <p className="text-sm text-slate-500 max-w-xs">
                Your consultation has been successfully moved to the new date and time slot.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {loadingDoctorData ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading clinician profile...</p>
                </div>
              ) : rescheduleDoctor ? (
                <div className="space-y-6">
                  {/* Doctor Profile Mini Banner */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shrink-0">
                      {rescheduleDoctor.userId?.name?.charAt(0) || "Dr"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-secondary text-sm">Dr. {rescheduleDoctor.userId?.name || "Clinician"}</h4>
                      <p className="text-[10px] font-bold text-medical-text-light uppercase tracking-wider mt-0.5">{rescheduleDoctor.specialty || "Specialist"}</p>
                    </div>
                  </div>

                  {/* Date selection picker */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-medical-text-light uppercase tracking-widest block">
                      1. Choose Consultation Date
                    </label>
                    <CalendarPicker
                      selectedDate={rescheduleDate}
                      onSelectDate={(newDate) => {
                        setRescheduleDate(newDate);
                        setRescheduleSlot("");
                        setRescheduleError("");
                      }}
                      availableSlots={rescheduleDoctor.availableSlots || []}
                    />
                  </div>

                  {/* Slot selector */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <label className="text-[9px] font-black text-medical-text-light uppercase tracking-widest block">
                        2. Select New Time Slot
                      </label>
                      {loadingSlots && (
                        <div className="flex items-center gap-1 text-primary">
                          <div className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          <span className="text-[9px] font-bold">Checking slots...</span>
                        </div>
                      )}
                    </div>

                    {rescheduleDate && (
                      <SlotPicker
                        available={slotInfo.available}
                        booked={slotInfo.booked}
                        value={rescheduleSlot}
                        onChange={(val) => {
                          setRescheduleSlot(val);
                          setRescheduleError("");
                        }}
                      />
                    )}

                    {rescheduleDate && !loadingSlots && slotInfo.isBlocked && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100/50 text-center">
                        <p className="text-xs text-amber-700 font-extrabold uppercase tracking-wider">
                          Doctor is unavailable / blocked on this date
                        </p>
                      </div>
                    )}

                    {rescheduleDate && !loadingSlots && !slotInfo.isBlocked && slotInfo.available.length === 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-bold">
                          No available times for this day. Please select another date.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-red-50 text-red-600 text-center text-sm font-bold">
                  Could not load clinician details.
                </div>
              )}

              {rescheduleError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-xs flex items-center gap-3 animate-in shake-in duration-300" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{rescheduleError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all focus:outline-none"
                  onClick={() => setRescheduleModalOpen(false)}
                  disabled={rescheduleSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rescheduleSubmitting || !rescheduleSlot || !rescheduleDate}
                  className="px-5 py-2.5 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-95 focus:outline-none"
                  onClick={handleConfirmReschedule}
                >
                  {rescheduleSubmitting ? "Rescheduling..." : "Confirm New Slot"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
