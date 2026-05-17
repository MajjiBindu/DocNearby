export default function SlotPicker({ available = [], booked = [], value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(available || []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(s)}
            className={`rounded-2xl border-2 px-4 py-4 text-sm font-black transition-all active:scale-95 shadow-sm ${
              value === s
                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                : 'border-slate-100 bg-white text-secondary hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {booked?.length ? (
        <div className="pt-4">
          <p className="mb-4 text-[10px] font-black text-medical-text-light uppercase tracking-[0.2em]">Already Booked</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(booked || []).map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className="rounded-2xl border border-slate-50 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-300 cursor-not-allowed opacity-50"
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

