import { useState, useMemo } from "react";

export default function CalendarPicker({ selectedDate, onSelectDate, availableSlots = [] }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Parse the selectedDate or default to current date
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    return new Date();
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Doctor's available weekdays as a Set (e.g. Set {"Mon", "Wed"})
  const doctorDays = useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) return null;
    return new Set(availableSlots.map((s) => s.day));
  }, [availableSlots]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar grid array
  const gridCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthTotalDays - i;
      const prevMonthDate = new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        prevDay
      );
      cells.push({
        dayNumber: prevDay,
        date: prevMonthDate,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(currentYear, currentMonth, d);
      cells.push({
        dayNumber: d,
        date: curDate,
        isCurrentMonth: true,
      });
    }

    // Trailing days of next month to fill complete 6-row grid (42 cells)
    const remaining = 42 - cells.length;
    for (let n = 1; n <= remaining; n++) {
      const nextMonthDate = new Date(
        currentMonth === 11 ? currentYear + 1 : currentYear,
        currentMonth === 11 ? 0 : currentMonth + 1,
        n
      );
      cells.push({
        dayNumber: n,
        date: nextMonthDate,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Format local date cleanly as YYYY-MM-DD
  const formatDateLocal = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="p-4 sm:p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
      {/* Month Year Header Selector */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl border border-slate-100 text-secondary hover:bg-slate-50 transition-colors focus:outline-none"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="font-black text-secondary text-sm sm:text-base uppercase tracking-widest">
          {monthNames[currentMonth]} {currentYear}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-xl border border-slate-100 text-secondary hover:bg-slate-50 transition-colors focus:outline-none"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid of Calendar Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {/* Weekday abbreviations */}
        {weekdayNames.map((dayName) => (
          <div key={dayName} className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider py-1">
            {dayName}
          </div>
        ))}

        {/* Cells */}
        {gridCells.map((cell, idx) => {
          const dateStr = formatDateLocal(cell.date);
          const isSelected = selectedDate === dateStr;

          // Check past status
          const cellDateZeroTime = new Date(cell.date);
          cellDateZeroTime.setHours(0, 0, 0, 0);
          const isPast = cellDateZeroTime < today;

          // Check if doctor works on this day
          const cellDayShort = cell.date.toLocaleDateString("en-US", { weekday: "short" });
          const isDoctorWorkingDay = doctorDays ? doctorDays.has(cellDayShort) : true;

          const isSelectable = !isPast && isDoctorWorkingDay && cell.isCurrentMonth;

          let btnClass = "w-9 h-9 sm:w-11 sm:h-11 rounded-2xl text-xs font-bold transition-all relative flex flex-col items-center justify-center focus:outline-none ";
          let dotColorClass = "";

          if (isSelected) {
            btnClass += "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10";
            dotColorClass = "bg-white";
          } else if (!cell.isCurrentMonth) {
            btnClass += "text-slate-300 pointer-events-none opacity-40";
          } else if (isPast) {
            btnClass += "text-slate-300 pointer-events-none line-through bg-slate-50/20";
          } else if (!isDoctorWorkingDay) {
            btnClass += "text-slate-300/80 bg-slate-50/50 cursor-not-allowed";
          } else {
            // Selectable worked day
            btnClass += "text-secondary hover:bg-slate-50 hover:scale-105 active:scale-95 border border-slate-100/50";
            dotColorClass = "bg-emerald-500 animate-pulse";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={!isSelectable}
              onClick={() => onSelectDate(dateStr)}
              className={btnClass}
            >
              <span>{cell.dayNumber}</span>
              {/* Dot Availability Indicator */}
              {isSelectable && (
                <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${dotColorClass}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active Workdays</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-200" />
          <span>Unavailable/Past</span>
        </div>
      </div>
    </div>
  );
}
