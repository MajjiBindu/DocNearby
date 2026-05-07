import Input from '../common/Input.jsx'
import { LANGUAGES, SPECIALTIES } from '../../utils/constants.js'

export default function DoctorFilters({ filters, setFilters }) {
  const update = (patch) => setFilters((f) => ({ ...(f || {}), ...patch }))
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">Specialty</label>
        <select
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filters?.specialty || ''}
          onChange={(e) => update({ specialty: e.target.value })}
        >
          <option value="">Any</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">Language</label>
        <select
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filters?.language || ''}
          onChange={(e) => update({ language: e.target.value })}
        >
          <option value="">Any</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Max fee (₹)"
        inputMode="numeric"
        value={filters?.maxFee || ''}
        onChange={(e) => update({ maxFee: e.target.value })}
        placeholder="e.g. 500"
      />
    </div>
  )
}

