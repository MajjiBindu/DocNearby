import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import translations from "../../utils/i18n.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize language from localStorage or default to 'en'
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
    <header className="bg-blue-popsicle sticky top-0 z-50 shadow-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-white text-xl tracking-tight">
            {t.brand}
          </Link>

          {/* Language Switcher - Hidden on mobile */}
          <div className="hidden md:block nav-lang-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `transition-all hover:underline decoration-redline decoration-2 underline-offset-8 ${isActive ? "text-redline font-bold" : "text-white/90"}`
            }
          >
            {t.search}
          </NavLink>
          <NavLink
            to="/labs"
            className={({ isActive }) =>
              `transition-all hover:underline decoration-redline decoration-2 underline-offset-8 ${isActive ? "text-redline font-bold" : "text-white/90"}`
            }
          >
            {t.nearby}
          </NavLink>

          {token ? (
            <>
              <NavLink
                to={user?.role === "doctor" ? "/doctor" : "/patient"}
                className="text-white/90 hover:text-redline transition-colors"
              >
                {t.dashboard}
              </NavLink>
              <button
                className="rounded-xl border border-white/20 px-4 py-1.5 text-white hover:bg-white/10 transition-all active:scale-95"
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
            <NavLink
              to="/login"
              className="rounded-xl bg-redline text-white px-6 py-2 hover:bg-redline/90 transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              {t.login}
            </NavLink>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6 text-white"
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
        <div className="md:hidden bg-blue-popsicle px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-300 shadow-xl">
          {/* Language Switcher - Mobile */}
          <div className="flex justify-center py-2 border-b border-white/10 nav-lang-switcher">
            <LanguageSwitcher />
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-3">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition-colors hover:bg-white/10 ${isActive ? "text-redline font-bold bg-white/5" : "text-white"}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {t.search}
            </NavLink>
            <NavLink
              to="/labs"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition-colors hover:bg-white/10 ${isActive ? "text-redline font-bold bg-white/5" : "text-white"}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {t.nearby}
            </NavLink>

            {token ? (
              <>
                <NavLink
                  to={user?.role === "doctor" ? "/doctor" : "/patient"}
                  className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.dashboard}
                </NavLink>
                <button
                  className="w-full text-left px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all"
                  onClick={() => {
                    logout();
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                  type="button"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="w-full text-center px-4 py-3 rounded-lg bg-redline text-white hover:bg-redline/90 transition-all shadow-lg"
                onClick={() => setMenuOpen(false)}
              >
                {t.login}
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
