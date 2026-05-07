import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import translations from '../../utils/i18n.js'

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Initialize language from localStorage or default to 'en'
  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('dn_lang', lang)
    // Dispatch a custom event so other components (like Home) can react to language changes
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
          
          {/* Language Switcher */}
          <div className="flex items-center gap-2 text-xs font-medium border rounded-lg px-2 py-1 bg-slate-50/50">
            <button 
              onClick={() => setLang('en')} 
              className={`transition-colors ${lang === 'en' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              EN
            </button>
            <span className="text-slate-200">|</span>
            <button 
              onClick={() => setLang('hi')} 
              className={`transition-colors ${lang === 'hi' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              हिं
            </button>
            <span className="text-slate-200">|</span>
            <button 
              onClick={() => setLang('te')} 
              className={`transition-colors ${lang === 'te' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              తె
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/search" className={({isActive}) => `transition-colors hover:text-indigo-600 ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>
            {t.search}
          </NavLink>
          <NavLink to="/labs" className={({isActive}) => `transition-colors hover:text-indigo-600 ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>
            {t.nearby}
          </NavLink>
          
          {token ? (
            <>
              <NavLink to={user?.role === 'doctor' ? '/doctor' : '/patient'} className="text-slate-600 hover:text-indigo-600 transition-colors">
                {t.dashboard}
              </NavLink>
              <button
                className="rounded-xl border border-slate-200 px-4 py-1.5 text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
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
            <NavLink to="/login" className="rounded-xl bg-slate-900 text-white px-5 py-1.5 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
              {t.login}
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
