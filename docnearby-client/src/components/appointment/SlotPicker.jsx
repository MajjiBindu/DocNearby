export default function SlotPicker({ available = [], booked = [], value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(available || []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(s)}
            className={`rounded-md border px-3 py-2 text-sm ${
              value === s
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {booked?.length ? (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Booked</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(booked || []).map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

