export const ROLES = ['patient', 'doctor', 'admin']

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']

export function env(name, fallback) {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return v
}

