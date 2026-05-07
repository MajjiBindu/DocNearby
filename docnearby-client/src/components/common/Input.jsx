export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm text-slate-700">{label}</span> : null}
      <input
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 ${className}`}
        {...props}
      />
    </label>
  )
}

