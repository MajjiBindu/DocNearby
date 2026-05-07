import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SlotPicker from '../components/appointment/SlotPicker.jsx'
import BookingForm from '../components/appointment/BookingForm.jsx'
import Spinner from '../components/common/Spinner.jsx'
import { appointmentApi, doctorApi } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'

function todayIso() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function BookAppointment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [date, setDate] = useState(todayIso())
  const [slot, setSlot] = useState('')
  const [slotInfo, setSlotInfo] = useState({ available: [], booked: [] })
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) navigate('/login', { replace: true, state: { from: `/book/${id}` } })
  }, [token, navigate, id])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoadingSlots(true)
      setMessage('')
      try {
        const res = await doctorApi.slots(id, date)
        const nextAvailable = res?.data?.available || []
        const nextBooked = res?.data?.booked || []
        if (!cancelled) {
          setSlotInfo({ available: nextAvailable, booked: nextBooked })
          setSlot(nextAvailable.includes(slot) ? slot : '')
        }
      } catch (e) {
        if (!cancelled) setMessage(e?.message || 'Failed to load slots')
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date])

  const canSubmit = useMemo(() => !!date && !!slot && !submitting, [date, slot, submitting])

  const confirm = async () => {
    if (!date || !slot) {
      setMessage('Please select both a date and a time slot.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const res = await appointmentApi.create({ doctorId: id, date, slot })
      if (res?.success) {
        setMessage('Booked successfully.')
        navigate('/patient')
      } else {
        setMessage(res?.message || 'Booking failed')
      }
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
        <p className="mt-1 text-sm text-slate-500">Select your preferred date and time slot below.</p>

        <div className="mt-8 grid gap-8">
          <BookingForm
            date={date}
            setDate={(val) => { setDate(val); setMessage(''); }}
            slot={slot}
            setSlot={(val) => { setSlot(val); setMessage(''); }}
            onConfirm={confirm}
            disabled={!canSubmit}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">Available slots</p>
              {loadingSlots ? <Spinner /> : null}
            </div>
            <SlotPicker
              available={slotInfo.available}
              booked={slotInfo.booked}
              value={slot}
              onChange={setSlot}
            />
            {!loadingSlots && !slotInfo.available.length ? (
              <p className="mt-2 text-sm text-slate-600">No slots available for this date.</p>
            ) : null}
          </div>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </div>
      </div>
    </div>
  )
}

