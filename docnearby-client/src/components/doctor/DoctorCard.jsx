import { Link } from 'react-router-dom'

export default function DoctorCard({ doctor }) {
  const name = doctor?.userId?.name || 'Doctor'
  const specialty = doctor?.specialty || ''
  const fee = doctor?.consultationFee ?? null
  const clinicName = doctor?.clinicId?.name || ''
  const city = doctor?.clinicId?.city || ''

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{name}</h3>
          <p className="text-sm text-slate-600">{specialty}</p>
          <p className="mt-1 text-xs text-slate-500">
            {clinicName}
            {clinicName && city ? ' • ' : ''}
            {city}
          </p>
        </div>
        {fee !== null ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            ₹{fee}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Rating: {doctor?.rating?.toFixed?.(1) ?? doctor?.rating ?? '—'} ({doctor?.reviewCount ?? 0})
        </p>
        <Link
          to={`/doctors/${doctor?._id}`}
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          View
        </Link>
      </div>
    </div>
  )
}

