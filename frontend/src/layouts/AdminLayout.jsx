import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { adminNavItems } from "../config/adminNav";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block border-r border-[#E5E5E5] bg-white h-screen sticky top-0 px-4 py-6">
          <Link to="/" className="block px-2 mb-8 font-serif text-lg text-[#111111]">Marketplace</Link>
          <nav className="flex flex-col gap-0.5">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.key} to={item.path} end={item.path === "/admin"}
                className={({ isActive }) => `px-3 py-2 rounded-xl text-sm transition-colors duration-200 ${isActive ? "bg-[#FBF6E9] text-[#111111] font-medium" : "text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111]"}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
              <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#FAFAFA] transition-colors">☰</button>
              <Link to="/" className="lg:hidden font-serif text-lg text-[#111111]">Marketplace</Link>

              <div className="hidden md:flex flex-1 max-w-sm">
                <input type="text" placeholder="Search users, sellers, orders..." className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button aria-label="Notifications" className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">
                  🔔<span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center">5</span>
                </button>

                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)} className="w-9 h-9 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E5E5] rounded-2xl shadow-md py-2 animate-fade-slide-up z-30">
                      <div className="px-4 py-2.5 border-b border-[#E5E5E5]">
                        <p className="text-sm font-medium text-[#111111] truncate">{user?.name}</p>
                        <p className="text-xs text-[#6B6B6B] truncate">{user?.email}</p>
                      </div>
                      <Link to="/admin/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">My Profile</Link>
                      <Link to="/admin/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Change Password</Link>
                      <button className="block w-full text-left px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Help & Support</button>
                      <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Log out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-6  mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${mobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-64 bg-white shadow-xl transition-transform duration-300 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#E5E5E5]">
            <Link to="/" onClick={() => setMobileNavOpen(false)} className="font-serif text-lg text-[#111111]">Marketplace</Link>
            <button onClick={() => setMobileNavOpen(false)} aria-label="Close" className="w-8 h-8 text-[#6B6B6B]">✕</button>
          </div>
          <nav className="flex flex-col gap-0.5 p-4">
            {adminNavItems.map((item) => (
              <NavLink key={item.key} to={item.path} end={item.path === "/admin"} onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) => `px-3 py-2.5 rounded-xl text-sm transition-colors duration-200 ${isActive ? "bg-[#FBF6E9] text-[#111111] font-medium" : "text-[#6B6B6B] hover:bg-[#FAFAFA]"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}