import Button from '../common/Button.jsx'

export default function DoctorProfileView({ doctor, onBook }) {
  if (!doctor) return null
  const name = doctor?.userId?.name || 'Doctor'
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{name}</h1>
          <p className="text-slate-600">{doctor.specialty}</p>
          <p className="mt-2 text-sm text-slate-600">
            {doctor.qualifications?.length ? doctor.qualifications.join(', ') : null}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Languages: {doctor.languages?.length ? doctor.languages.join(', ') : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
            ₹{doctor.consultationFee ?? '—'}
          </span>
          <Button type="button" onClick={onBook}>
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  )
}

