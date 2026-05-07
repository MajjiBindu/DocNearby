import { useEffect, useState } from 'react'
import AppointmentCard from '../components/appointment/AppointmentCard.jsx'
import Spinner from '../components/common/Spinner.jsx'
import Modal from '../components/common/Modal.jsx'
import { appointmentApi } from '../services/api.js'

export default function PatientDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await appointmentApi.mine()
      // API may return array directly or {appointments: []}
      const list = Array.isArray(data) ? data : data?.appointments ?? []
      setAppointments(list)
    } catch (e) {
      setError(e?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = new Date()
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.date) >= today &&
      (a.status === 'pending' || a.status === 'confirmed'),
  )
  const past = appointments.filter((a) => upcoming.indexOf(a) === -1)

  const openCancelModal = (appt) => {
    setCancelTarget(appt)
    setModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await appointmentApi.updateStatus(cancelTarget._id, 'cancelled')
      await load()
    } catch (e) {
      console.error('Cancel failed', e)
    } finally {
      setModalOpen(false)
      setCancelTarget(null)
    }
  }

  const renderList = (list) => {
    if (list.length === 0) {
      return <p className="text-center text-gray-600">No appointments here yet.</p>
    }
    return (
      <div className="space-y-4">
        {list.map((appt) => {
          let borderClass = ''
          if (appt.status === 'completed') borderClass = 'border-l-4 border-emerald-500'
          else if (appt.status === 'cancelled') borderClass = 'border-l-4 border-red-400'

          const canCancel = appt.status === 'pending' || appt.status === 'confirmed'

          return (
            <div key={appt._id} className={borderClass}>
              <AppointmentCard
                appt={appt}
                onCancel={canCancel ? () => openCancelModal(appt) : undefined}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">My Appointments</h1>
        {loading && <Spinner className="ml-2" />}
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${
            activeTab === 'upcoming' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'past' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      {activeTab === 'upcoming' ? renderList(upcoming) : renderList(past)}

      <Modal
        open={modalOpen}
        title="Cancel this appointment?"
        onClose={() => setModalOpen(false)}
      >
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => setModalOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={confirmCancel}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  )
}
