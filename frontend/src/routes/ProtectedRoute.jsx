import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for the initial /auth/me answer, otherwise a logged-in user
  // would flash to /login on every page refresh
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#C9A227] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Remember where they were going so login can send them back
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}