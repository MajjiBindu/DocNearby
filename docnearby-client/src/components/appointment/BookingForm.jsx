export default function BookingForm({ date, setDate, onConfirm, disabled }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="medical-label mb-2 block">Consultation Date</label>
        <input
          type="date"
          className="medical-input !h-14"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <button 
        type="button" 
        onClick={onConfirm} 
        disabled={disabled}
        className="btn-primary w-full !py-4 !text-lg disabled:opacity-50"
      >
        Confirm Booking
      </button>
    </div>
  )
}

