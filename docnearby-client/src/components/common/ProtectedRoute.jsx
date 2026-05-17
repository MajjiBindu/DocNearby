import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) return <Spinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
