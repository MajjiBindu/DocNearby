export default function SlotPicker({ available = [], booked = [], value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(available || []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(s)}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-black transition-all active:scale-95 shadow-sm ${
              value === s
                ? 'border-redline bg-redline text-white shadow-redline/20'
                : 'border-grey-blue-leaf/10 bg-white text-blue-popsicle hover:bg-blue-popsicle/5 hover:border-blue-popsicle/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {booked?.length ? (
        <div>
          <p className="mb-3 text-[10px] font-black text-grey-blue-leaf/40 uppercase tracking-[0.2em]">Already Booked</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(booked || []).map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className="rounded-xl border border-slate-100 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-300 cursor-not-allowed"
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

