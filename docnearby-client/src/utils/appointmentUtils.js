/**
 * Utility functions for appointment logic
 */

/**
 * Parses appointment date and slot to a safe Date object.
 * Returns null if appointment data is missing or invalid.
 */
export const toDateTime = (appointment) => {
  if (!appointment || !appointment.date) return null;
  
  try {
    const d = new Date(appointment.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const [time, meridiem] = (appointment.slot || "12:00 PM").split(" ");
    
    let [hours, minutes] = (time || "12:00").split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    
    return new Date(`${dateStr}T${String(hours || 0).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`);
  } catch (e) {
    console.error("Failed to parse appointment date", e);
    return null;
  }
};

/**
 * Checks if an appointment is eligible for cancellation by a patient.
 */
export const isCancellable = (appointment) => {
  if (!appointment) return false;
  
  const status = (appointment.status || "booked").toLowerCase().trim();
  const nonCancellableStatuses = [
    "completed",
    "cancelled",
    "prescription_shared",
    "in_consultation"
  ];

  if (nonCancellableStatuses.includes(status)) {
    return false;
  }

  const apptDate = toDateTime(appointment);
  if (!apptDate) return false;

  const now = new Date();
  return apptDate > now;
};

/**
 * Checks if an appointment should be considered 'Upcoming'.
 */
export const isUpcoming = (appointment) => {
  if (!appointment) return false;
  
  const status = (appointment.status || "").toLowerCase().trim();
  const terminatedStatuses = ["cancelled", "completed", "prescription_shared"];
  
  if (terminatedStatuses.includes(status)) {
    return false;
  }

  const apptDate = toDateTime(appointment);
  if (!apptDate) return false;

  const now = new Date();
  return apptDate > now;
};

/**
 * Checks if an appointment should be considered 'Past/History'.
 */
export const isPast = (appointment) => {
  if (!appointment) return false;
  
  const status = (appointment.status || "").toLowerCase().trim();
  const terminatedStatuses = ["completed", "prescription_shared", "cancelled"];
  
  if (terminatedStatuses.includes(status)) {
    return true;
  }

  const apptDate = toDateTime(appointment);
  if (!apptDate) return true; // Default to past if invalid to prevent blocking upcoming

  const now = new Date();
  return apptDate <= now;
};
