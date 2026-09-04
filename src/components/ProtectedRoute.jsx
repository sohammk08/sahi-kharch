// Guards routes from unauthorized access

import { ImSpinner10 } from "react-icons/im";
import { useAuth } from "../context/useAuth.js";
import { Navigate, useLocation } from "react-router-dom";

// Guards routes from unauthorized access and optionally restricts access to users with specific roles.
function ProtectedRoute({ roles, children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ImSpinner10 className="size-8 animate-spin text-black/50" />
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(profile?.role))
    return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
