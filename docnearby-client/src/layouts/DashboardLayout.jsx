import { cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function DashboardLayout({
  children,
  title,
  subtitle,
  menuItems,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="bg-medical-grey min-h-screen pb-20 pt-6 sm:pt-10">
      <div className="dashboard-container">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar - Professional Enterprise Style */}
          <aside
            className="hidden lg:block h-fit sticky top-28"
            aria-label="Dashboard Sidebar"
          >
            <div className="medical-card p-8 mb-6">
              <div className="flex items-center gap-4 mb-8" aria-hidden="true">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20">
                  {user?.name?.[0] || "U"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-secondary tracking-tight truncate">
                    {user?.name}
                  </h3>
                  <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                    {user?.role} Profile
                  </p>
                </div>
              </div>

              <nav className="space-y-2" aria-label="Dashboard navigation">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    onClick={() =>
                      item.onClick ? item.onClick() : navigate(item.path)
                    }
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      item.active
                        ? "bg-primary text-white shadow-xl shadow-primary/20"
                        : "text-medical-text-light hover:bg-slate-50 hover:text-secondary"
                    }`}
                    aria-current={item.active ? "page" : undefined}
                  >
                    <div className="flex items-center gap-4">
                      {cloneElement(item.icon, { "aria-hidden": "true" })}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {!item.active && (
                      <svg
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="medical-card p-6 shadow-md">
              <div className="text-secondary">
  <p className="text-xs font-bold text-medical-text-light uppercase tracking-widest mb-4">
                  Support & Help
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => window.open("https://docs.docnearby.com", "_blank")}
                    title="Help Center"
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Help Center
                  </button>
                  <button
                    onClick={() => window.open("mailto:support@docnearby.com")}
                    title="Contact Support"
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                      />
                    </svg>
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-10" id="main-dashboard-content">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-secondary">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-medical-text-light font-bold mt-1 max-w-xl leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest">
                    Network Status
                  </p>
                  <div
                    className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider"
                    role="status"
                  >
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                      aria-hidden="true"
                    />
                    Live Clinical Sync
                  </div>
                </div>
              </div>
            </header>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
