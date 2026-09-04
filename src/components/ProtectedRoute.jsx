// Guards routes from unauthorized access

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

// Guards routes from unauthorized access and optionally restricts access to users with specific roles.
function ProtectedRoute({ roles, children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(profile?.role))
    return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
