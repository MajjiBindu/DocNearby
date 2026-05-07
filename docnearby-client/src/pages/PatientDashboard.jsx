import { useEffect, useState } from 'react'
import AppointmentCard from '../components/appointment/AppointmentCard.jsx'
import Spinner from '../components/common/Spinner.jsx'
import { appointmentApi } from '../services/api.js'

export default function PatientDashboard() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await appointmentApi.mine()
      setItems(res?.data?.appointments || [])
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

  const cancel = async (id) => {
    await appointmentApi.updateStatus(id, 'cancelled')
    await load()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My Appointments</h1>
        {loading ? <Spinner /> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <AppointmentCard
            key={a._id}
            appt={a}
            onCancel={a.status === 'pending' || a.status === 'confirmed' ? () => cancel(a._id) : null}
          />
        ))}
      </div>
    </div>
  )
}

