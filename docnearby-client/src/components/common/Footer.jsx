export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-purple-shadow">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-white/40 font-medium">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/60 font-bold tracking-tight">© {new Date().getFullYear()} DocNearby</p>
          <p className="text-white/30 italic">
            Built for independent doctors & small clinics in Tier 2/3 India.
          </p>
        </div>
      </div>
    </footer>
  )
}

