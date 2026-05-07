import { formatDate } from '../../utils/formatDate.js'

export default function AppointmentCard({ appt, onCancel, onComplete }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {appt?.doctorId?.userId?.name || 'Doctor'} • {appt?.doctorId?.specialty || ''}
          </p>
          <p className="text-sm text-slate-600">
            {formatDate(appt?.date)} • {appt?.slot}
          </p>
          <p className="mt-1 text-xs text-slate-500">{appt?.clinicId?.name}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {appt?.status}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        {onCancel ? (
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
        {onComplete ? (
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={onComplete}
          >
            Mark completed
          </button>
        ) : null}
      </div>
    </div>
  )
}

