import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import translations from "../../utils/i18n.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

export default function Navbar() {
  const { isAuthenticated, isInitialized, user, logout } = useAuth();
  const navigate = useNavigate();

  const [lang, setLang] = useState(
    () => localStorage.getItem("dn_lang") || "en",
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem("dn_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  const t = translations[lang];

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl group-hover:bg-primary-dark transition-colors">
              D
            </div>
            <span className="font-extrabold text-secondary text-2xl tracking-tight hidden sm:block">
              Doc<span className="text-primary">Nearby</span>
            </span>
          </Link>

          <div className="hidden lg:block nav-lang-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors hover:text-primary ${isActive ? "text-primary" : "text-medical-text"}`
              }
            >
              {t.search}
            </NavLink>
            <NavLink
              to="/labs"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors hover:text-primary ${isActive ? "text-primary" : "text-medical-text"}`
              }
            >
              {t.nearby}
            </NavLink>
            <NavLink
              to="/clinics"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors hover:text-primary ${isActive ? "text-primary" : "text-medical-text"}`
              }
            >
              Clinics
            </NavLink>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

          <div className="flex items-center gap-4">
            {!isInitialized ? null : isAuthenticated ? (
              <>
                <NotificationDropdown />
                <NavLink
                  to={user?.role === "doctor" ? "/doctor" : "/patient"}
                  className="text-sm font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {t.dashboard}
                </NavLink>
                <button
                  className="btn-secondary !py-1.5 !px-4 !text-sm"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  type="button"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn-primary !py-2 !px-6 !text-sm">
                {t.login}
              </NavLink>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-xl text-secondary hover:bg-slate-50 transition-colors border border-slate-100"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-center pb-4 border-b border-slate-100 nav-lang-switcher">
            <LanguageSwitcher />
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-base font-semibold transition-all ${isActive ? "bg-primary-light text-primary-dark" : "text-medical-text hover:bg-slate-50"}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {t.search}
            </NavLink>
            <NavLink
              to="/labs"
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-base font-semibold transition-all ${isActive ? "bg-primary-light text-primary-dark" : "text-medical-text hover:bg-slate-50"}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {t.nearby}
            </NavLink>

            <div className="pt-4 flex flex-col gap-3">
              {!isInitialized ? null : isAuthenticated ? (
                <>
                  <NavLink
                    to={user?.role === "doctor" ? "/doctor" : "/patient"}
                    className="px-4 py-3 rounded-xl text-base font-semibold text-secondary hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t.dashboard}
                  </NavLink>
                  <button
                    className="w-full btn-secondary"
                    onClick={() => {
                      logout();
                      navigate("/login");
                      setMenuOpen(false);
                    }}
                  >
                    {t.logout}
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="w-full btn-primary text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.login}
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
