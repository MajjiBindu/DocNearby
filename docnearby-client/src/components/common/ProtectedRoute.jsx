import { Navigate, useLocation as useRRLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth()
  const loc = useRRLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles?.length && user?.role && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

