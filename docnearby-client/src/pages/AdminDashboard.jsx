import { useEffect, useState, useMemo, useCallback } from "react";
import SEO from "../components/common/SEO.jsx";
import { adminApi } from "../services/api.js";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import {
  DashboardStatCard,
  DashboardWidget,
} from "../components/dashboard/DashboardComponents.jsx";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [userPage] = useState(1);
  const [userSearch] = useState("");
  const [userRole] = useState("");

  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("");

  const [selectedStatus] = useState("");
  const [appointmentPage] = useState(1);

  const [reviewPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const menuItems = [
    {
      id: "overview",
      label: "System Overview",
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      active: activeTab === "overview",
      onClick: () => setActiveTab("overview"),
    },
    {
      id: "doctors",
      label: "Doctor Approvals",
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      active: activeTab === "doctors",
      onClick: () => setActiveTab("doctors"),
    },
    {
      id: "users",
      label: "User Directory",
      icon: (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      active: activeTab === "users",
      onClick: () => setActiveTab("users"),
    },
    {
      id: "appointments",
      label: "Clinical Records",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      active: activeTab === "appointments",
      onClick: () => setActiveTab("appointments"),
    },
    {
      id: "reviews",
      label: "Moderation",
      icon: (
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      active: activeTab === "reviews",
      onClick: () => setActiveTab("reviews"),
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch), 300);
    return () => clearTimeout(timer);
  }, [doctorSearch]);

  const loadAllData = useCallback(async () => {
    // Defer loading state to avoid cascading render warning
    Promise.resolve().then(() => setLoading(true));
    try {
      const statsRes = await adminApi.stats();
      setStats(statsRes?.data || null);

      if (activeTab === "users") {
        const usersRes = await adminApi.users({
          page: userPage,
          search: userSearch,
          role: userRole,
          limit: 15,
        });
        setUsers(usersRes?.data?.users || []);
      } else if (activeTab === "doctors") {
        const docRes = await adminApi.pendingDoctors();
        setPendingDoctors(docRes?.data?.doctors || []);
      } else if (activeTab === "appointments") {
        await adminApi.allAppointments({
          page: appointmentPage,
          limit: 15,
          status: selectedStatus,
        });
      } else if (activeTab === "reviews") {
        await adminApi.reviews({
          page: reviewPage,
          limit: 15,
        });
      }
    } catch {
      setError("Synchronicity failure in administrative records");
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    userPage,
    userSearch,
    userRole,
    appointmentPage,
    selectedStatus,
    reviewPage,
  ]);

  useEffect(() => {
    // loadAllData();
  }, [loadAllData]);

  const filteredPendingDoctors = useMemo(() => {
    if (!debouncedDoctorSearch) return pendingDoctors;
    const s = debouncedDoctorSearch.toLowerCase();
    return pendingDoctors.filter(
      (doc) =>
        doc.userId?.name?.toLowerCase().includes(s) ||
        doc.specialty?.toLowerCase().includes(s),
    );
  }, [pendingDoctors, debouncedDoctorSearch]);

  const handleVerify = async (id, name) => {
    try {
      await adminApi.verifyDoctor(id);
      setToast(`${name} has been authorized for clinical practice`);
      loadAllData();
    } catch {
      setToast("Authorization failure");
    }
  };

  const handleReject = async (id, name) => {
    const reason = window.prompt(
      `Rejection Protocol for Dr. ${name}. Specify grounds:`,
      "Credential mismatch",
    );
    if (reason === null) return;
    try {
      await adminApi.rejectDoctor(id, reason);
      setToast(`${name} access credentials revoked`);
      loadAllData();
    } catch {
      setToast("Revocation failure");
    }
  };

  const renderOverview = () => (
    <div
      className="space-y-8 animate-in fade-in duration-700"
      role="tabpanel"
      aria-labelledby="tab-overview"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <DashboardWidget
          title="Service Utilization"
          subtitle="Appointment distribution by clinical status"
        >
          <div
            className="space-y-5 py-4"
            aria-label="Appointment status distribution"
          >
            {Object.entries(stats?.appointmentsByStatus || {}).map(
              ([status, count]) => (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div
                    className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100"
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemin="0"
                    aria-valuemax={stats?.totalAppointments || 1}
                  >
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(count / (stats?.totalAppointments || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </DashboardWidget>
        <DashboardWidget
          title="Verification Queue"
          subtitle="Practitioners awaiting credential review"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="text-3xl font-black text-secondary mb-2"
              aria-live="polite"
            >
              {pendingDoctors.length}
            </div>
            <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">
              Pending Clinical Reviews
            </p>
            <button
              onClick={() => setActiveTab("doctors")}
              className="mt-6 px-6 py-2 rounded-xl border-2 border-primary text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              Launch Review Protocol
            </button>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div
      className="space-y-6 animate-in slide-in-from-bottom-10 duration-700"
      role="tabpanel"
      aria-labelledby="tab-doctors"
    >
      <div className="flex gap-4 mb-4">
        <label htmlFor="doctor-search" className="sr-only">
          Search Doctors
        </label>
        <input
          id="doctor-search"
          type="text"
          placeholder="Search by name or specialty..."
          className="medical-input !py-3 flex-1 focus:ring-primary"
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" role="list">
        {filteredPendingDoctors.map((doc) => (
          <article
            key={doc._id}
            role="listitem"
            className="medical-card p-6 border-2 border-slate-50 hover:border-primary/20 transition-all flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary outline-none"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-black text-secondary leading-tight">
                    {doc.userId?.name}
                  </h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {doc.specialty}
                  </p>
                </div>
                <span className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-medical-text-light uppercase border border-slate-100">
                  {doc.experience} YRS
                </span>
              </div>
              <div className="space-y-2 mb-8 p-4 bg-slate-50/50 rounded-2xl">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-medical-text-light uppercase">
                    Email
                  </span>
                  <span className="text-secondary">{doc.userId?.email}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-medical-text-light uppercase">Fee</span>
                  <span className="text-secondary">₹{doc.consultationFee}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleVerify(doc._id, doc.userId?.name)}
                className="btn-primary flex-1 !py-2.5 !text-[10px] !uppercase focus:ring-offset-2"
                aria-label={`Verify credentials for Dr. ${doc.userId?.name}`}
              >
                Verify
              </button>
              <button
                onClick={() => handleReject(doc._id, doc.userId?.name)}
                className="btn-secondary flex-1 !py-2.5 !text-[10px] !uppercase !text-rose-500 hover:!border-rose-200 focus:ring-offset-2"
                aria-label={`Reject credentials for Dr. ${doc.userId?.name}`}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
        {filteredPendingDoctors.length === 0 && (
          <div
            className="col-span-full py-20 text-center font-black text-medical-text-light uppercase tracking-widest text-xs opacity-50"
            role="status"
          >
            Zero pending verifications in queue
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Administrative Command"
      subtitle="Full platform oversight and professional verification protocols."
      menuItems={menuItems}
    >
      <SEO
        title="Admin Control Center"
        description="Oversee platform operations, verify medical professionals, and manage user directory."
      />

      <div className="space-y-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
          role="region"
          aria-label="System-wide metrics summary"
        >
          <DashboardStatCard
            title="Total Registry"
            value={stats?.totalUsers || 0}
            icon={
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
            color="primary"
          />
          <DashboardStatCard
            title="Verified Clinicals"
            value={stats?.verifiedDoctors || 0}
            icon={
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="success"
          />
          <DashboardStatCard
            title="Patient Base"
            value={stats?.totalPatients || 0}
            icon={
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            color="info"
          />
          <DashboardStatCard
            title="Total Encounters"
            value={stats?.totalAppointments || 0}
            icon={
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
            }
            color="warning"
          />
        </div>

        {error && (
          <div
            className="p-5 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            className="flex min-h-[400px] flex-col items-center justify-center gap-4 medical-card animate-pulse"
            aria-busy="true"
          >
            <div
              className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
              aria-hidden="true"
            />
            <p className="font-black text-medical-text-light uppercase tracking-widest text-xs">
              Synchronizing platform data
            </p>
          </div>
        ) : (
          <div className="focus:outline-none">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "doctors" && renderDoctors()}
            {activeTab === "users" && (
              <DashboardWidget
                title="User Registry"
                subtitle="Historical logs of all platform users"
                role="tabpanel"
                aria-labelledby="tab-users"
              >
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-left"
                    aria-label="System user directory"
                  >
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th
                          className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light"
                          scope="col"
                        >
                          Identity
                        </th>
                        <th
                          className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light"
                          scope="col"
                        >
                          Access Layer
                        </th>
                        <th
                          className="py-4 text-[10px] font-black uppercase tracking-widest text-medical-text-light text-right"
                          scope="col"
                        >
                          Moderation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr
                          key={u._id}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <div className="font-extrabold text-secondary">
                              {u.name}
                            </div>
                            <div className="text-[10px] font-bold text-medical-text-light uppercase">
                              {u.email}
                            </div>
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === "admin" ? "bg-purple-50 text-purple-600" : u.role === "doctor" ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-500"}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() =>
                                adminApi.updateUserRole(
                                  u._id,
                                  u.role === "patient" ? "doctor" : "patient",
                                )
                              }
                              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline focus:outline-none"
                              aria-label={`Toggle access for ${u.name}`}
                            >
                              Toggle Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardWidget>
            )}
            {activeTab === "appointments" && (
              <DashboardWidget
                title="Clinical Logs"
                subtitle="Global record of all patient-practitioner interactions"
                role="tabpanel"
                aria-labelledby="tab-appointments"
              >
                <div
                  className="py-20 text-center font-black text-medical-text-light uppercase tracking-widest text-xs opacity-50"
                  role="status"
                >
                  Synchronizing interaction logs...
                </div>
              </DashboardWidget>
            )}
            {activeTab === "reviews" && (
              <DashboardWidget
                title="Moderation Interface"
                subtitle="Patient feedback and clinical rating moderation"
                role="tabpanel"
                aria-labelledby="tab-reviews"
              >
                <div
                  className="py-20 text-center font-black text-medical-text-light uppercase tracking-widest text-xs opacity-50"
                  role="status"
                >
                  Loading moderation queue...
                </div>
              </DashboardWidget>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-10 right-10 p-5 rounded-2xl bg-secondary text-white shadow-2xl animate-in slide-in-from-right-10 duration-500 flex items-center gap-4 z-50"
          role="status"
          aria-live="polite"
        >
          <div
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black"
            aria-hidden="true"
          >
            i
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-60">
              System Log
            </p>
            <p className="font-bold">{toast}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-4 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"
            aria-label="Close notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
