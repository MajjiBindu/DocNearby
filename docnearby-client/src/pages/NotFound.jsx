import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-10 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you’re looking for doesn’t exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

