import { LANGUAGES, SPECIALTIES } from '../../utils/constants.js'

export default function DoctorFilters({ filters, setFilters }) {
  const update = (patch) => setFilters((f) => ({ ...(f || {}), ...patch }))
  
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="medical-label">Medical Specialty</label>
        <select
          className="medical-input !py-2.5 !text-sm appearance-none cursor-pointer"
          value={filters?.specialty || ''}
          onChange={(e) => update({ specialty: e.target.value })}
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="medical-label">Preferred Language</label>
        <select
          className="medical-input !py-2.5 !text-sm appearance-none cursor-pointer"
          value={filters?.language || ''}
          onChange={(e) => update({ language: e.target.value })}
        >
          <option value="">Any Language</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="medical-label">Maximum Consultation Fee (₹)</label>
        <input
          type="number"
          inputMode="numeric"
          className="medical-input !py-2.5 !text-sm"
          value={filters?.maxFee || ''}
          onChange={(e) => update({ maxFee: e.target.value })}
          placeholder="e.g. 1000"
        />
      </div>
    </div>
  )
}

