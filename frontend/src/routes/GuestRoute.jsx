import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomeForRole } from "../utils/roleUtils";

// Mirror image of ProtectedRoute: pages that only make sense when logged OUT
export function GuestRoute() {
  const { user, loading } = useAuth();

  // Wait for the initial /auth/me answer, or a logged-in user would flash the login page on refresh
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#C9A227] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to={getHomeForRole(user.role)} replace />;

  return <Outlet />;
}