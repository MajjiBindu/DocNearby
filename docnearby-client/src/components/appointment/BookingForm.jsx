import Button from '../common/Button.jsx'

export default function BookingForm({ date, setDate, slot, setSlot, onConfirm, disabled }) {
  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-[10px] font-black text-grey-blue-leaf uppercase tracking-[0.2em]">Select Date</span>
        <input
          type="date"
          className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 text-base text-blue-popsicle font-bold focus:bg-white focus:ring-8 focus:ring-blue-popsicle/5 focus:border-blue-popsicle/20 outline-none transition-all shadow-inner"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <Button 
        type="button" 
        onClick={onConfirm} 
        disabled={disabled}
        className="w-full py-5 rounded-2xl bg-redline text-white font-black text-lg hover:bg-redline/90 shadow-2xl shadow-redline/20 transition-all active:scale-95 border-none disabled:opacity-50"
      >
        Confirm Booking
      </Button>
    </div>
  )
}

