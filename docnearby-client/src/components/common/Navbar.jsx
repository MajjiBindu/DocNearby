import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-slate-900">
          DocNearby
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/search" className="text-slate-700 hover:text-slate-900">
            Search
          </NavLink>
          {token ? (
            <>
              {user?.role === 'doctor' ? (
                <NavLink to="/doctor" className="text-slate-700 hover:text-slate-900">
                  Dashboard
                </NavLink>
              ) : (
                <NavLink to="/patient" className="text-slate-700 hover:text-slate-900">
                  Dashboard
                </NavLink>
              )}
              <button
                className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="rounded-md bg-slate-900 text-white px-3 py-1.5">
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

