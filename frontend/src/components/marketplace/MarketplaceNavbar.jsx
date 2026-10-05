import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { getHomeForRole } from "../../utils/roleUtils";
import { useClickOutside } from "../../hooks/useClickOutside";
const CENTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "#featured-products" },
  { label: "Categories", href: "#categories" },
  { label: "Sellers", href: "#sellers" },
];

export function MarketplaceNavbar() {
  const { user, loading, logout } = useAuth();
  const { totalCount, openDrawer } = useCart();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOnGuestAuthPage = ["/login", "/register", "/forgot-password"].includes(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-6">
        <Link to="/" className="font-serif text-lg text-[#111111] shrink-0">Marketplace</Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-[#6B6B6B]">
          {CENTER_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-[#111111] transition-colors">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex flex-1 max-w-xs ml-auto">
          <input type="text" placeholder="Search products..." className="w-full px-4 py-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
        </div>

        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          {loading ? null : !user ? (
            !isOnGuestAuthPage && (
              <>
                <Link to="/login" className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors px-3">Sign In</Link>
                <Link to="/register" className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">Create Account</Link>
              </>
            )
          ) : user.role === "seller" ? (
            <>
              <button aria-label="Notifications" className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">🔔</button>
              <Link to={getHomeForRole("seller")} className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 ml-1">Seller Dashboard</Link>
              <ProfileMenu user={user} logout={logout} open={profileOpen} setOpen={setProfileOpen} />
            </>
          ) : (
            <>
              <Link to="/customer" state={{ tab: "wishlist" }} aria-label="Wishlist" className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">♡</Link>
              <button onClick={openDrawer} aria-label="Cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">
                🛍️
                {totalCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">{totalCount}</span>}
              </button>
              <button aria-label="Notifications" className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">🔔</button>
              <ProfileMenu user={user} logout={logout} open={profileOpen} setOpen={setProfileOpen} />
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden ml-auto w-10 h-10 flex items-center justify-center text-[#111111]">☰</button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-xl p-5 animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-lg text-[#111111]">Marketplace</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close">✕</button>
            </div>
            <nav className="flex flex-col gap-1 mb-6">
              {CENTER_LINKS.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="px-2 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA] rounded-xl">{l.label}</a>
              ))}
            </nav>
            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center border border-[#E5E5E5] py-2.5 rounded-full text-sm">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center bg-[#111111] text-white py-2.5 rounded-full text-sm">Create Account</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Link to={getHomeForRole(user.role)} onClick={() => setMobileOpen(false)} className="px-2 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA] rounded-xl">
                  {user.role === "seller" ? "Seller Dashboard" : "My Dashboard"}
                </Link>
                <button onClick={logout} className="text-left px-2 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">Log out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ProfileMenu({ user, logout, open, setOpen }) {
  const menuRef = useClickOutside(open, () => setOpen(false));
  return (
       <div className="relative ml-1" ref={menuRef}>
      <button onClick={() => setOpen((v) => !v)} className="w-9 h-9 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
        {user?.name?.charAt(0).toUpperCase() || "U"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E5E5] rounded-2xl shadow-md py-2 animate-fade-slide-up z-30">
          <Link to={getHomeForRole(user.role)} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-[#111111] hover:bg-[#FAFAFA]">My Dashboard</Link>
          <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Log out</button>
        </div>
      )}
    </div>
  );
}