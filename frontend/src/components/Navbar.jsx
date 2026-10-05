import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomeForRole } from "../utils/roleUtils";
import { useCart } from "../hooks/useCart";
const GUEST_AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function Navbar() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { totalCount, openDrawer } = useCart();
  const isOnGuestAuthPage = GUEST_AUTH_PATHS.includes(location.pathname);
  // exact match on the role's home now; startsWith once real subpages exist (/seller/products etc.)
  const isOnOwnDashboard = user && location.pathname === getHomeForRole(user.role);

  return (
    <header className="border-b border-[#E5E5E5] bg-white/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg text-[#111111] tracking-tight">
          Marketplace
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? null : user ? (
            // Logged in: only show the dashboard link if we're NOT already there
            !isOnOwnDashboard && (
              <Link
                to={getHomeForRole(user.role)}
                className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              >
                Open Dashboard
              </Link>
            )
          ) : (
            // Logged out: skip sign-in/sign-up links on the auth pages themselves
            !isOnGuestAuthPage && (
              <>
                <Link to="/login" className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                >
                  Create account
                </Link>
              </>
            )

          )}
          <button onClick={openDrawer} aria-label="Cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">
            🛍️
            {totalCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">
                {totalCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}