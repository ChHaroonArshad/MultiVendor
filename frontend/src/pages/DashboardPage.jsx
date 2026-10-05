import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
// import { useCart } from "../hooks/useCart";
import { useCart } from "../hooks/useCart";
export function DashboardPage() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();




  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const roleLabel = user.role === "seller" ? "Seller" : user.role === "admin" ? "Admin" : "Customer";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-[#E5E5E5] px-8 py-10 sm:px-12 animate-fade-slide-up">
          <span className="inline-block px-3 py-1 text-xs border border-[#C9A227]/40 bg-[#FBF6E9] text-[#8a6f14] rounded-full mb-4">
            {roleLabel} account
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#111111] mb-1">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#6B6B6B] mb-8">
            {user.email} · {user.isEmailVerified ? "Email verified" : "Email not verified"}
          </p>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-[#111111]">Password</p>
              <p className="text-xs text-[#6B6B6B]">Change it regularly to keep your account secure.</p>
            </div>
            <Link
              to="/account/change-password"
              className="text-center bg-[#111111] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            >
              Change password
            </Link>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors disabled:opacity-50"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}