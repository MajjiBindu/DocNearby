import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import translations from '../../utils/i18n.js'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('dn_lang', lang)
    // Dispatch a custom event so other components (like Home) can update if they are on the same page
    window.dispatchEvent(new Event('languageChange'))
  }, [lang])

  const t = translations[lang]

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-slate-900">
            {t.brand}
          </Link>
          
          <div className="flex items-center gap-2 text-xs font-medium border rounded px-2 py-1">
            <button onClick={() => setLang('en')} className={lang === 'en' ? 'text-slate-900' : 'text-slate-400'}>EN</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setLang('hi')} className={lang === 'hi' ? 'text-slate-900' : 'text-slate-400'}>हिं</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setLang('te')} className={lang === 'te' ? 'text-slate-900' : 'text-slate-400'}>తె</button>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/search" className="text-slate-700 hover:text-slate-900">
            {t.search}
          </NavLink>
          <NavLink to="/labs" className="text-slate-700 hover:text-slate-900">
            {t.nearby}
          </NavLink>
          
          {token ? (
            <>
              <NavLink to={user?.role === 'doctor' ? '/doctor' : '/patient'} className="text-slate-700 hover:text-slate-900">
                {t.dashboard}
              </NavLink>
              <button
                className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                type="button"
              >
                {t.logout}
              </button>
            </>
          ) : (
            <NavLink to="/login" className="rounded-md bg-slate-900 text-white px-3 py-1.5">
              {t.login}
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

