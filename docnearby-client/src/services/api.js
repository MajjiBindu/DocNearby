import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function unwrap(promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem("dn_token");
      localStorage.removeItem("dn_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    throw error;
  }
}

export const authApi = {
  requestSignupOtp: ({ name, email, password, role }) =>
    unwrap(
      api.post("/auth/signup/request-otp", { name, email, password, role }),
    ),
  verifySignupOtp: ({ email, otp }) =>
    unwrap(api.post("/auth/signup/verify-otp", { email, otp })),
  requestLoginOtp: ({ email, password }) =>
    unwrap(api.post("/auth/login/request-otp", { email, password })),
  verifyLoginOtp: ({ email, otp }) =>
    unwrap(api.post("/auth/login/verify-otp", { email, otp })),
  requestPasswordReset: ({ email }) =>
    unwrap(api.post("/auth/forgot-password", { email })),
  resetPassword: ({ token, password }) =>
    unwrap(api.post(`/auth/reset-password/${token}`, { password })),
  resendOtp: ({ email, purpose }) =>
    unwrap(api.post("/auth/resend-otp", { email, purpose })),
  logout: () => unwrap(api.post("/auth/logout")),
  me: () => unwrap(api.get("/auth/me")),
};

export const doctorApi = {
  list: (params) => unwrap(api.get("/doctors", { params })),
  get: (id) => unwrap(api.get(`/doctors/${id}`)),
  me: () => unwrap(api.get("/doctors/me")),
  update: (id, payload) => unwrap(api.put(`/doctors/${id}`, payload)),
  updateAvailability: (id, payload) =>
    unwrap(api.put(`/doctors/${id}/availability`, payload)),
  slots: (id, date) =>
    unwrap(api.get(`/doctors/${id}/slots`, { params: { date } })),
};

export const clinicApi = {
  list: (params) => unwrap(api.get("/clinics", { params })),
  get: (id) => unwrap(api.get(`/clinics/${id}`)),
  create: (payload) => unwrap(api.post("/clinics", payload)),
};

export const appointmentApi = {
  create: (payload) => unwrap(api.post("/appointments", payload)),
  patient: () => unwrap(api.get("/appointments/mine")),
  doctor: () => unwrap(api.get("/appointments/doctor")),
  updateStatus: (id, status) =>
    unwrap(api.patch(`/appointments/${id}/status`, { status })),
};

export const reviewApi = {
  create: (payload) => unwrap(api.post("/reviews", payload)),
  byDoctor: (doctorId) => unwrap(api.get(`/reviews/doctor/${doctorId}`)),
};

export const prescriptionApi = {
  create: (payload) => unwrap(api.post("/prescriptions", payload)),
  patient: () => unwrap(api.get("/prescriptions/my")),
  byAppointment: (appointmentId) => unwrap(api.get(`/prescriptions/appointment/${appointmentId}`)),
};

export const symptomApi = {
  suggest: (symptoms) => unwrap(api.post("/symptoms/suggest", { symptoms })),
};

export const labApi = {
  list: (params) => unwrap(api.get("/labs", { params })),
  get: (id) => unwrap(api.get(`/labs/${id}`)),
};

export const adminApi = {
  pendingDoctors: () => unwrap(api.get("/admin/doctors/pending")),
  verifyDoctor: (id) => unwrap(api.patch(`/admin/doctors/${id}/verify`)),
  rejectDoctor: (id, reason) =>
    unwrap(api.patch(`/admin/doctors/${id}/reject`, { reason })),
  allAppointments: (params) =>
    unwrap(api.get("/admin/appointments", { params })),
  deleteReview: (id) => unwrap(api.delete(`/admin/reviews/${id}`)),
  stats: () => unwrap(api.get("/admin/stats")),
  users: (params) => unwrap(api.get("/admin/users", { params })),
  updateUserRole: (id, role) =>
    unwrap(api.patch(`/admin/users/${id}/role`, { role })),
  reviews: (params) => unwrap(api.get("/admin/reviews", { params })),
  getUsers: () => unwrap(api.get("/admin/users")),
  deactivateUser: (id) => unwrap(api.patch(`/admin/users/${id}/deactivate`)),
};

export const searchApi = {
  suggestions: (q) => unwrap(api.get("/search/suggestions", { params: { q } })),
  trending: () => unwrap(api.get("/search/trending")),
  global: (params) => unwrap(api.get("/search/global", { params })),
};
