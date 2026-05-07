import Button from '../common/Button.jsx'

export default function BookingForm({ date, setDate, slot, setSlot, onConfirm, disabled }) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Date</span>
        <input
          type="date"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <Button type="button" onClick={onConfirm} disabled={disabled}>
        Confirm Booking
      </Button>
    </div>
  )
}

