import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/common/Navbar.jsx'
import Footer from './components/common/Footer.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import DoctorProfile from './pages/DoctorProfile.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/book/:id" element={<BookAppointment />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/patient"
            element={
              <ProtectedRoute roles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/patient" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
