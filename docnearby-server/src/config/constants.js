export const ROLES = ['patient', 'doctor', 'admin']

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const APPOINTMENT_STATUSES = [
  'pending',
  'booked',
  'confirmed',
  'arrived',
  'in_consultation',
  'completed',
  'prescription_shared',
  'cancelled'
]

export const SPECIALTIES = [
  'General Physician',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'ENT Specialist',
  'Orthopedic',
  'Dentist',
]

export const LANGUAGES = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Bengali']

export function env(name, fallback) {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return v
}

