import { Navigate, useLocation as useRRLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingScreen from './LoadingScreen.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { token, user, isInitialized, isAuthenticated } = useAuth()
  const loc = useRRLocation()

  if (token && !isInitialized) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  if (roles?.length && user?.role && !roles.includes(user.role)) {
    const fallback = user.role === 'doctor' ? '/doctor' : '/patient'
    return <Navigate to={fallback} replace />
  }

  return children
}

