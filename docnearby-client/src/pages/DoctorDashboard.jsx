import { useEffect, useState } from 'react'
import Spinner from '../components/common/Spinner.jsx'
import Modal from '../components/common/Modal.jsx'
import { appointmentApi } from '../services/api.js'

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await appointmentApi.doctor()
      const list = Array.isArray(data) ? data : data?.appointments ?? []
      setAppointments(list)
    } catch (e) {
      setError(e?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const todays = appointments
    .filter((a) => a.date && a.date.startsWith(todayStr))
    .sort((a, b) => {
      return a.slot?.localeCompare(b.slot ?? '')
    })

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentApi.updateStatus(id, status)
      await load()
    } catch (e) {
      console.error('Status update failed', e)
    }
  }

  const openSlotsModal = () => setModalOpen(true)

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        {loading && <Spinner className="ml-2" />}
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {/* Section 1 – Today's Schedule */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Today's Schedule</h2>
        {loading ? (
          <Spinner />
        ) : todays.length === 0 ? (
          <p className="text-center text-gray-600">No appointments scheduled for today.</p>
        ) : (
          <table className="w-full table-auto border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Slot</th>
                <th className="px-3 py-2 text-left">Patient</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todays.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-3 py-2">{a.slot}</td>
                  <td className="px-3 py-2">{a.patient?.name || a.patient?.userId?.name || 'N/A'}</td>
                  <td className="px-3 py-2">
                    <a href={`tel:${a.patient?.phone || a.patient?.userId?.phone}`} className="text-blue-600 hover:underline">
                      {a.patient?.phone || a.patient?.userId?.phone || 'N/A'}
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{a.status}</span>
                  </td>
                  <td className="px-3 py-2 space-x-1">
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button
                        className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
                        onClick={() => handleStatusUpdate(a._id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    )}
                    {a.status === 'pending' && (
                      <button
                        className="rounded-md bg-slate-900 px-2 py-1 text-sm text-white hover:bg-slate-800"
                        onClick={() => handleStatusUpdate(a._id, 'confirmed')}
                      >
                        Confirm
                      </button>
                    )}
                    {a.status === 'confirmed' && (
                      <button
                        className="rounded-md bg-slate-900 px-2 py-1 text-sm text-white hover:bg-slate-800"
                        onClick={() => handleStatusUpdate(a._id, 'completed')}
                      >
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Section 2 – Manage My Slots */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Manage My Slots</h2>
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          onClick={openSlotsModal}
        >
          Edit Slots
        </button>
        <Modal open={modalOpen} title="Edit Availability Slots" onClose={() => setModalOpen(false)}>
          <p className="text-sm">
            To update your availability slots, use the API:<br />
            <code className="bg-gray-100 rounded px-1">PUT /api/doctors/:id</code> with <code className="bg-gray-100 rounded px-1">availableSlots</code> array.
          </p>
        </Modal>
      </section>
    </div>
  )
}
