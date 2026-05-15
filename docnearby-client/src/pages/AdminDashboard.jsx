import { useEffect, useState, useMemo } from 'react'
import { adminApi } from '../services/api.js'
import Spinner from '../components/common/Spinner.jsx'
import Button from '../components/common/Button.jsx'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  
  const [users, setUsers] = useState([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')

  const [pendingDoctors, setPendingDoctors] = useState([])
  const [doctorSearch, setDoctorSearch] = useState('')
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState('')

  const [appointments, setAppointments] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [appointmentTotal, setAppointmentTotal] = useState(0)

  const [reviews, setReviews] = useState([])
  const [reviewTotal, setReviewTotal] = useState(0)
  const [reviewPage, setReviewPage] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Debounce doctor search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch), 300)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  const filteredPendingDoctors = useMemo(() => {
    if (!debouncedDoctorSearch) return pendingDoctors
    const s = debouncedDoctorSearch.toLowerCase()
    return pendingDoctors.filter(doc => 
      doc.userId?.name?.toLowerCase().includes(s) || 
      doc.specialty?.toLowerCase().includes(s)
    )
  }, [pendingDoctors, debouncedDoctorSearch])

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchStats()
    if (activeTab === 'users') fetchUsers(userPage, userSearch, userRole)
    if (activeTab === 'doctors') fetchPendingDoctors()
    if (activeTab === 'appointments') fetchAppointments(appointmentPage, selectedStatus)
    if (activeTab === 'reviews') fetchReviews(reviewPage)
  }, [activeTab, userPage, userSearch, userRole, appointmentPage, selectedStatus, reviewPage])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.stats()
      setStats(res?.data || null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async (page = 1, search = '', role = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.users({ page, search, role, limit: 20 })
      setUsers(res?.data?.users || [])
      setUserTotal(res?.data?.total || 0)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDoctors = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.pendingDoctors()
      setPendingDoctors(res?.data?.doctors || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch pending doctors')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async (page = 1, status = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.allAppointments({ page, limit: 20, status })
      setAppointments(res?.data?.appointments || [])
      setAppointmentTotal(res?.data?.total || 0)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.reviews({ page, limit: 20 })
      setReviews(res?.data?.reviews || [])
      setReviewTotal(res?.data?.total || 0)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id, name) => {
    if (!window.confirm(`Verify Dr. ${name}? They will be notified by email.`)) return
    try {
      await adminApi.verifyDoctor(id)
      setToast(`Dr. ${name} verified.`)
      fetchPendingDoctors()
      fetchStats()
    } catch (e) {
      alert(e?.response?.data?.message || 'Verification failed')
    }
  }

  const handleReject = async (id, name) => {
    const reason = window.prompt(`Reject Dr. ${name}? Enter reason (optional):`, "Does not meet verification criteria")
    if (reason === null) return
    if (!window.confirm(`Are you sure you want to reject Dr. ${name}?`)) return
    try {
      await adminApi.rejectDoctor(id, reason)
      setToast(`Dr. ${name} rejected.`)
      fetchPendingDoctors()
      fetchStats()
    } catch (e) {
      alert(e?.response?.data?.message || 'Rejection failed')
    }
  }

  const handleRoleChange = async (id, name, currentRole) => {
    const newRole = currentRole === 'patient' ? 'doctor' : 'patient'
    if (!window.confirm(`Change ${name}'s role to ${newRole.toUpperCase()}?`)) return
    try {
      await adminApi.updateUserRole(id, newRole)
      setToast(`Role updated for ${name}.`)
      fetchUsers(userPage, userSearch, userRole)
    } catch (e) {
      alert(e?.response?.data?.message || 'Role update failed')
    }
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return
    try {
      await adminApi.deactivateUser(id)
      setToast('User deactivated.')
      fetchUsers(userPage, userSearch, userRole)
    } catch (e) {
      alert(e?.response?.data?.message || 'Deactivation failed')
    }
  }

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review? Doctor rating will be recalculated.")) return
    try {
      await adminApi.deleteReview(id)
      setToast('Review deleted.')
      setReviews(prev => prev.filter(r => r._id !== id))
      fetchStats()
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed')
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Patient Name', 'Patient Email', 'Doctor Name', 'Date', 'Slot', 'Status', 'Clinic']
    const rows = appointments.map(a => [
      `"${a._id}"`,
      `"${a.patientId?.name || ''}"`,
      `"${a.patientId?.email || ''}"`,
      `"Dr. ${a.doctorId?.userId?.name || ''}"`,
      `"${new Date(a.date).toLocaleDateString()}"`,
      `"${a.slot}"`,
      `"${a.status}"`,
      `"${a.clinicName || a.clinicId?.name || 'N/A'}"`
    ])

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "appointments.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 font-sans">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1 text-sm">Monitor platform health and manage operations.</p>
          </div>
          
          <div className="flex rounded-xl bg-white p-1 shadow-sm border border-slate-200 overflow-x-auto">
            {['overview', 'users', 'doctors', 'appointments', 'reviews', 'stats'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  // Reset pagination when switching tabs
                  setUserPage(1)
                  setAppointmentPage(1)
                  setReviewPage(1)
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'doctors' ? 'Pending Doctors' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Doctors', value: stats.totalDoctors, color: 'text-indigo-600' },
              { label: 'Verified', value: stats.verifiedDoctors, color: 'text-emerald-600' },
              { label: 'Total Patients', value: stats.totalPatients, color: 'text-blue-600' },
              { label: 'Appointments', value: stats.totalAppointments, color: 'text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value || 0}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {loading && activeTab !== 'doctors' ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="mx-auto h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Platform Pulse</h2>
                <p className="text-slate-500 max-w-sm mx-auto">Welcome to your command center. Use the tabs above to manage users, verify professionals, and oversee patient care.</p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      setUserPage(1)
                    }}
                  />
                  <select 
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={userRole}
                    onChange={(e) => {
                      setUserRole(e.target.value)
                      setUserPage(1)
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="patient">Patients</option>
                    <option value="doctor">Doctors</option>
                  </select>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">User</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Role</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Verification</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                u.role === 'doctor' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black uppercase ${u.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {u.isVerified ? '✓ Verified' : '○ Unverified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {u.role !== 'admin' && (
                                <button 
                                  onClick={() => handleRoleChange(u._id, u.name, u.role)}
                                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 underline"
                                >
                                  Change Role
                                </button>
                              )}
                              <Button 
                                onClick={() => handleDeactivate(u._id)} 
                                disabled={!u.isActive}
                                className={`text-[10px] px-3 py-1.5 ${!u.isActive ? 'opacity-50 grayscale' : ''}`}
                              >
                                {u.isActive ? 'Deactivate' : 'Inactive'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* User Pagination */}
                <div className="flex items-center justify-between mt-4">
                   <p className="text-xs text-slate-500 font-bold">Total: {userTotal} users</p>
                   <div className="flex gap-2">
                      <Button 
                        disabled={userPage === 1} 
                        onClick={() => setUserPage(p => p - 1)}
                        className="px-3 py-1 text-[10px]"
                      >Prev</Button>
                      <Button 
                        disabled={userPage * 20 >= userTotal} 
                        onClick={() => setUserPage(p => p + 1)}
                        className="px-3 py-1 text-[10px]"
                      >Next</Button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Filter by name or specialty..." 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPendingDoctors.length === 0 ? (
                    <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                      <p className="text-lg font-bold">No matching verifications.</p>
                    </div>
                  ) : (
                    filteredPendingDoctors.map((doc) => (
                      <div key={doc._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-black text-slate-900 leading-tight">{doc.userId?.name}</h3>
                              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{doc.specialty}</p>
                            </div>
                            <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500">
                              {doc.experience} YRS EXP
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            {[
                              { label: 'EMAIL', value: doc.userId?.email },
                              { label: 'FEE', value: `₹${doc.consultationFee}`, bold: true },
                              { label: 'QUALIF', value: doc.qualifications?.join(', ') || 'N/A' },
                            ].map(item => (
                              <div key={item.label} className="flex items-center gap-2 text-xs">
                                <span className="font-black text-slate-300 w-16">{item.label}</span>
                                <span className={`${item.bold ? 'font-black text-slate-900' : 'text-slate-600'}`}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-50">
                          <Button 
                            onClick={() => handleVerify(doc._id, doc.userId?.name)} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          >Verify</Button>
                          <button 
                            onClick={() => handleReject(doc._id, doc.userId?.name)}
                            className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 font-black rounded-xl border border-rose-100 hover:bg-rose-100 transition-all text-xs uppercase"
                          >Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex flex-wrap gap-2">
                    {['', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status)
                          setAppointmentPage(1)
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                          selectedStatus === status 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {status === '' ? 'ALL' : status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-xl text-xs border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    EXPORT CSV
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date/Time</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Patient</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Doctor</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold">No appointments found.</td>
                          </tr>
                        ) : (
                          appointments.map((appt) => (
                            <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-black text-slate-900">{new Date(appt.date).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-500 font-medium">{appt.slot}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{appt.patientId?.name}</p>
                                <p className="text-xs text-slate-400">{appt.patientId?.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">Dr. {appt.doctorId?.userId?.name}</p>
                                <p className="text-xs text-slate-400 uppercase font-black text-[10px]">{appt.doctorId?.specialty}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                                  appt.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 
                                  appt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {appt.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Appointment Pagination */}
                <div className="flex items-center justify-between">
                   <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Page {appointmentPage}</p>
                   <div className="flex gap-2">
                      <Button 
                        disabled={appointmentPage === 1} 
                        onClick={() => setAppointmentPage(p => p - 1)}
                        className="px-3 py-1 text-[10px]"
                      >Prev</Button>
                      <Button 
                        disabled={appointmentPage * 20 >= appointmentTotal} 
                        onClick={() => setAppointmentPage(p => p + 1)}
                        className="px-3 py-1 text-[10px]"
                      >Next</Button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Patient</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Doctor</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Rating</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Comment</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reviews.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">No reviews found.</td>
                          </tr>
                        ) : (
                          reviews.map((r) => (
                            <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{r.patientId?.name}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">Dr. {r.doctorId?.userId?.name}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex text-amber-400">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-slate-600 max-w-xs truncate">{r.comment}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDeleteReview(r._id)}
                                  className="text-rose-600 hover:text-rose-700 font-black text-[10px] uppercase tracking-widest underline"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Review Pagination */}
                <div className="flex items-center justify-between">
                   <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Total: {reviewTotal}</p>
                   <div className="flex gap-2">
                      <Button 
                        disabled={reviewPage === 1} 
                        onClick={() => setReviewPage(p => p - 1)}
                        className="px-3 py-1 text-[10px]"
                      >Prev</Button>
                      <Button 
                        disabled={reviewPage * 20 >= reviewTotal} 
                        onClick={() => setReviewPage(p => p + 1)}
                        className="px-3 py-1 text-[10px]"
                      >Next</Button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Appointment Distribution</h3>
                  <div className="space-y-6">
                    {Object.entries(stats.appointmentsByStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-600 uppercase tracking-tighter">{status}</span>
                        <div className="flex items-center gap-4">
                          <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600" 
                              style={{ width: `${(count / stats.totalAppointments) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-black text-slate-900">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">User Ratios</h3>
                   <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-black text-slate-600 uppercase">Patients</span>
                          <span className="text-sm font-black text-slate-900">{stats.totalPatients}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-full opacity-40"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-black text-slate-600 uppercase">Doctors</span>
                          <span className="text-sm font-black text-slate-900">{stats.totalDoctors}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 w-full opacity-40"></div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">{toast}</p>
          </div>
        )}
      </div>
    </div>
  )
}
