import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getHomeForRole } from "../../utils/roleUtils";
import { BrandMark, Icon } from "./marketplaceUi";
import { categories } from "../../data/marketplaceData";
import { getCategoryVisual } from "../../data/homeContent";
import { Avatar } from "../ui/Avatar";
import { useEffect, useRef } from "react";
import { WishlistHeaderLink } from "../wishlist/WishlistHeaderLink";
const CENTER_LINKS = [
  { label: "Home", to: "/" },
  // { label: "Products", to: "/#featured-products" },
  // { label: "Categories", to: "/#categories" },
  { label: "Sellers", to: "/#sellers" },
  { label: "Products", to: "/products" },
  { label: "Categories", to: "/categories" },
];
import { NotificationBell } from "../notifications/NotificationBell"; 
import { MessagesButton  } from "../chat/MessagesButton"; 

const iconBtn =
  "relative cursor-pointer w-10 h-10 rounded-full flex items-center justify-center text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/40 transition-colors";

function SearchBox({ onDone, className = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onDone?.();
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A968D] pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className="w-full pl-10 pr-4 py-2 rounded-full border border-[#E8E5DF] bg-[#FAF9F6] text-sm placeholder:text-[#9A968D] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
      />
    </form>
  );
}

export function MarketplaceNavbar() {
  const { user, loading, logout } = useAuth();
  const { totalCount, openDrawer } = useCart();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOnGuestAuthPage = ["/login", "/register", "/forgot-password"].includes(location.pathname);
  const isHome = location.pathname === "/" && !location.hash;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#E8E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-8">
        <Link to="/" aria-label="Home" className="shrink-0">
          <BrandMark />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[13px]">
          {CENTER_LINKS.map((l) => {
            const active = l.label === "Home" && isHome;
            const cls = `py-1 border-b transition-colors inline-flex items-center gap-1 ${active ? "text-[#111111] border-[#C9A227]" : "text-[#6B6B6B] border-transparent hover:text-[#111111]"
              }`;

            if (l.label !== "Categories") {
              return <Link key={l.label} to={l.to} className={cls}>{l.label}</Link>;
            }
            return (
              <div key={l.label} className="relative group">
                <Link to={l.to} className={cls}>
                  {l.label} <Icon name="chevronDown" size={13} />
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 hidden group-hover:block group-focus-within:block">
                  <div className="w-56 bg-white border border-[#E8E5DF] rounded-2xl shadow-md py-2 animate-fade-slide-up">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        // to={`/?category=${encodeURIComponent(c.id)}#featured-products`}
                        to={`/products?category=${encodeURIComponent(c.id)}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[#4A4A4A] hover:bg-[#FAF9F6] hover:text-[#111111]"
                      >
                        <Icon name={getCategoryVisual(c.name).icon} size={16} className="text-[#9A968D]" /> {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <SearchBox className="hidden md:block flex-1 max-w-xs ml-auto" />

        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {loading ? null : !user ? (
            !isOnGuestAuthPage && (
              <>
                <Link to="/login" className="text-sm text-[#6B6B6B] hover:text-[#111111] transition-colors px-3">Sign In</Link>
                <Link to="/register" className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">Create Account</Link>
              </>
            )
          ) : user.role === "seller" ? (
            <>
     <NotificationBell />
              <Link to={getHomeForRole("seller")} className="bg-[#111111] text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 ml-1">Seller Dashboard</Link>
              <ProfileMenu user={user} logout={logout} open={profileOpen} setOpen={setProfileOpen} />
            </>
          ) : (
            <>
             <WishlistHeaderLink />
              <button onClick={openDrawer} aria-label="Cart" className={iconBtn}>
                <Icon name="bag" size={18} />
                {totalCount > 0 && (
                  <span className=" absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">{totalCount}</span>
                )}
              </button>
             <NotificationBell />
              <ProfileMenu user={user} logout={logout} open={profileOpen} setOpen={setProfileOpen} />
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(true)}  aria-label="Open menu" className={` cursor-pointer lg:hidden ml-auto ${iconBtn}`}>
          <Icon name="menu" size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 cursor-pointer">
              <BrandMark />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className={iconBtn}><Icon name="close" size={18} /></button>
            </div>
            <SearchBox onDone={() => setMobileOpen(false)} className="mb-4" />
            <nav className="flex flex-col gap-0.5 mb-6">
              {CENTER_LINKS.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-[#111111] hover:bg-[#FAF9F6] rounded-xl">{l.label}</Link>
              ))}
            </nav>
            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center cursor-pointer border border-[#E8E5DF] py-2.5 rounded-full text-sm">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className=" cursor-pointer text-center bg-[#111111] text-white py-2.5 rounded-full text-sm">Create Account</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-t border-[#E8E5DF] pt-4">
                <Link to={getHomeForRole(user.role)} onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-[#111111] hover:bg-[#FAF9F6] rounded-xl cursor-pointer">
                  {user.role === "seller" ? "Seller Dashboard" : "My Dashboard"}
                </Link>
                <button onClick={logout} className="cursor-pointer  text-left px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">Log out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ProfileMenu({ user, logout, open, setOpen }) {
  const wrapperRef = useRef(null);

  // Close on a press outside or on Escape. Using pointerdown (not click) means the same
  // click that opens the menu can never close it again.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const dashboardLabel =
    user.role === "seller" ? "Seller Dashboard" : user.role === "admin" ? "Admin Dashboard" : "My Dashboard";

  const items = [
    { label: dashboardLabel, to: getHomeForRole(user.role) },
    ...(user.role === "customer"
      ? [{ label: "My Orders", to: "/customer/orders" }, { label: "Wishlist", to: "/customer/wishlist" }]
      : []),
  ];

  return (
    <div className="relative ml-1" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className=" cursor-pointer w-9 h-9 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50"
      >
        {user?.name?.charAt(0).toUpperCase() || "U"}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E8E5DF] rounded-2xl shadow-lg py-2 animate-fade-slide-up z-50">
          <div className="px-4 py-2 border-b border-[#F0EEE9] mb-1">
            <p className="text-sm font-medium text-[#111111] truncate">{user.name}</p>
            {user.email && <p className="text-[11px] text-[#9A968D] truncate">{user.email}</p>}
          </div>
          {items.map((item) => (
            <Link key={item.label} role="menuitem" to={item.to} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-[#111111] hover:bg-[#FAF9F6]">
              {item.label}
            </Link>
          ))}
          <Link to="/help" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-[#111111] hover:bg-[#FAFAFA]">Help & Support</Link>
          <button role="menuitem" onClick={() => { setOpen(false); logout(); }} className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}