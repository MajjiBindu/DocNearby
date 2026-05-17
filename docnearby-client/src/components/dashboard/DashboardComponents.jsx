
export function DashboardStatCard({ title, value, icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
    danger: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="medical-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-medical-text-light uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-black text-secondary tracking-tight">{value}</p>
        </div>
      </div>
      {trend && (
        <div className={`text-xs font-black px-2 py-1 rounded-lg ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}

export function DashboardWidget({ title, subtitle, children, action, icon }) {
  return (
    <div className="medical-card h-full flex flex-col shadow-xl shadow-slate-200/50">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h3 className="text-lg font-black text-secondary tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs font-bold text-medical-text-light uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className="p-6 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function DashboardTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 mb-8 w-fit min-w-[300px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === tab.id 
              ? 'bg-white text-primary shadow-md' 
              : 'text-medical-text-light hover:text-secondary'
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
