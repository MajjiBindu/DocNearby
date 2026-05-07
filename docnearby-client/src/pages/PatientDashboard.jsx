import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppointmentCard from '../components/appointment/AppointmentCard.jsx'
import Spinner from '../components/common/Spinner.jsx'
import Modal from '../components/common/Modal.jsx'
import { appointmentApi } from '../services/api.js'
import translations from '../utils/i18n.js'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('dn_lang') || 'en')
    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  const t = translations[lang]

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await appointmentApi.mine()
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
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center animate-in fade-in duration-500">
          <div className="rounded-full bg-slate-50 p-4">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t.noAppointments}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === 'upcoming' 
                ? (lang === 'en' ? "You don't have any upcoming visits scheduled." : t.noSchedule)
                : t.pastHistoryDesc || "Your past history will appear here."}
            </p>
          </div>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => navigate('/search')}
              className="mt-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            >
              {t.bookNow}
            </button>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {list.map((appt) => {
          let borderClass = ''
          if (appt.status === 'completed') borderClass = 'border-l-4 border-emerald-500 rounded-lg'
          else if (appt.status === 'cancelled') borderClass = 'border-l-4 border-red-400 rounded-lg'

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
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.appointments}</h1>
            <p className="text-slate-500">View and manage your healthcare schedule.</p>
          </div>
          {loading && appointments.length > 0 && <Spinner className="h-6 w-6 text-indigo-600" />}
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex gap-2 p-1 w-fit rounded-2xl bg-slate-200/50 backdrop-blur-sm">
            <button
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                activeTab === 'upcoming' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              {t.upcoming}
            </button>
            <button
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                activeTab === 'past' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('past')}
            >
              {t.past}
            </button>
          </div>

          {loading && appointments.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white animate-in fade-in duration-500">
              <Spinner className="h-10 w-10 text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">{t.loadingSchedule}</p>
            </div>
          ) : (
            activeTab === 'upcoming' ? renderList(upcoming) : renderList(past)
          )}
        </div>

        <Modal
          open={modalOpen}
          title={t.cancelBtn}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-6 py-2">
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                onClick={() => setModalOpen(false)}
              >
                Keep
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
                onClick={confirmCancel}
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
