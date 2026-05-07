export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DocNearby</p>
          <p className="text-slate-500">
            Built for independent doctors & small clinics in Tier 2/3 India.
          </p>
        </div>
      </div>
    </footer>
  )
}

