import { useEffect, useState } from 'react'
import { adminApi } from '../services/api.js'
import Spinner from '../components/common/Spinner.jsx'
import Button from '../components/common/Button.jsx'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingDoctors()
    } else {
      fetchAppointments(1)
    }
  }, [activeTab])

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

  const fetchAppointments = async (page) => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.allAppointments({ page, limit: 20 })
      setAppointments(res?.data?.appointments || [])
      setPagination({
        page: res?.data?.page,
        totalPages: res?.data?.totalPages,
      })
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id) => {
    try {
      await adminApi.verifyDoctor(id)
      fetchPendingDoctors()
    } catch (e) {
      alert(e?.response?.data?.message || 'Verification failed')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'completed': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage doctors and platform activities.</p>
          </div>
          
          <div className="flex rounded-xl bg-white p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Doctors
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'appointments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Appointments
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {activeTab === 'pending' ? (
              <div className="divide-y divide-slate-100">
                {pendingDoctors.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <p className="text-lg font-medium">No pending verifications.</p>
                  </div>
                ) : (
                  pendingDoctors.map((doc) => (
                    <div key={doc._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{doc.userId?.name}</h3>
                        <p className="text-sm text-slate-600">{doc.specialty} • {doc.userId?.phone}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {doc.clinicId?.name}, {doc.clinicId?.city}
                        </p>
                      </div>
                      <Button onClick={() => handleVerify(doc._id)} className="sm:w-auto">
                        Verify Doctor
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Slot</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                          No appointments found.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((apt) => (
                        <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{apt.patientId?.name}</p>
                            <p className="text-xs text-slate-500">{apt.patientId?.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {apt.doctorId?.userId?.name || 'Doctor'}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">{new Date(apt.date).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">{apt.slot}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={pagination.page === 1}
                        onClick={() => fetchAppointments(pagination.page - 1)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => fetchAppointments(pagination.page + 1)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
