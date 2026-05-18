/**
 * DateTime & Numeric Utilities
 */

export const parseNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const dayOfWeekShort = (date) => {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (typeof date === "string" && date.includes("-")) {
    const [yyyy, mm, dd] = date.split("-").map(Number);
    return map[new Date(yyyy, mm - 1, dd).getDay()];
  }
  return map[new Date(date).getDay()];
};

export const minutesFromHHMM = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

export const formatAMPM = (totalMinutes) => {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};
