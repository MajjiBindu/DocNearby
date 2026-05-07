import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

async function unwrap(promise) {
  const { data } = await promise
  return data
}

export const authApi = {
  sendOtp: ({ phone, role }) => unwrap(api.post('/auth/send-otp', { phone, role })),
  verifyOtp: ({ phone, otp, role, name }) =>
    unwrap(api.post('/auth/verify-otp', { phone, otp, role, name })),
  me: () => unwrap(api.get('/auth/me')),
}

export const doctorApi = {
  list: (params) => unwrap(api.get('/doctors', { params })),
  get: (id) => unwrap(api.get(`/doctors/${id}`)),
  update: (id, payload) => unwrap(api.put(`/doctors/${id}`, payload)),
  slots: (id, date) => unwrap(api.get(`/doctors/${id}/slots`, { params: { date } })),
}

export const clinicApi = {
  list: (params) => unwrap(api.get('/clinics', { params })),
  get: (id) => unwrap(api.get(`/clinics/${id}`)),
  create: (payload) => unwrap(api.post('/clinics', payload)),
}

export const appointmentApi = {
  create: (payload) => unwrap(api.post('/appointments', payload)),
  mine: () => unwrap(api.get('/appointments/mine')),
  doctor: () => unwrap(api.get('/appointments/doctor')),
  updateStatus: (id, status) => unwrap(api.patch(`/appointments/${id}/status`, { status })),
}

export const labApi = {
  list: (params) => unwrap(api.get('/labs', { params })),
  get: (id) => unwrap(api.get(`/labs/${id}`)),
}

export const reviewApi = {
  create: (payload) => unwrap(api.post('/reviews', payload)),
  byDoctor: (doctorId) => unwrap(api.get(`/reviews/doctor/${doctorId}`)),
}

export const symptomApi = {
  suggest: (symptoms) => unwrap(api.post('/symptoms/suggest', { symptoms })),
}
