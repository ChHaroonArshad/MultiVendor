// frontend/src/pages/customer/CustomerDashboard.jsx
import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useClickOutside } from "../../hooks/useClickOutside";

import {
  mockCustomer, mockDashboardStats, mockActiveOrder, mockOrders, mockWishlist,
  mockProducts, mockBasket, mockActivity, mockInsights,
} from "../../data/customerMockData";




const navSections = [
  {
    label: "Shopping", items: [
      { key: "overview", label: "Overview", path: "/customer" },
      { key: "orders", label: "Orders", path: "/customer/orders" },
    ]
  },
  {
    label: "Account", items: [
      { key: "settings", label: "Settings", path: "/customer/settings" },
    ]
  },
];

const mobileNavItems = [
  { key: "overview", label: "Home", path: "/customer" },
  { key: "orders", label: "Orders", path: "/customer/orders" },
  { key: "basket", label: "Basket", path: "/customer/basket", badgeKey: "basket" },
  { key: "wishlist", label: "Wishlist", path: "/customer/wishlist" },
  { key: "settings", label: "Account", path: "/customer/settings" },
];

export function StatusBadge({ status }) {
  const styles = {
    ordered: "bg-[#F3F3F3] text-[#6B6B6B]",
    processing: "bg-[#F3F3F3] text-[#6B6B6B]",
    confirmed: "bg-blue-50 text-blue-600",
    shipped: "bg-[#FBF6E9] text-[#8a6f14]",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-600",
  };
  return <span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] || styles.ordered}`}>{status}</span>;
}

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="text-center py-16 px-4 border border-dashed border-[#E5E5E5] rounded-2xl bg-white">
      <div className="w-12 h-12 mx-auto rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-xl mb-4">✨</div>
      <p className="text-sm font-medium text-[#111111] mb-1">{title}</p>
      <p className="text-xs text-[#6B6B6B] mb-5 max-w-xs mx-auto">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="inline-block bg-[#111111] text-white text-xs font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-all duration-200">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function OrderTimeline({ status }) {
  const steps = ["ordered", "confirmed", "shipped", "delivered"];
  const currentIndex = steps.indexOf(status) === -1 ? 0 : steps.indexOf(status);
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors duration-300 ${i <= currentIndex ? "bg-[#111111] text-white" : "bg-[#F3F3F3] text-[#B0B0B0]"}`}>
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span className={`mt-1.5 text-[10px] capitalize ${i <= currentIndex ? "text-[#111111]" : "text-[#B0B0B0]"}`}>{step}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 mb-4 transition-colors duration-300 ${i < currentIndex ? "bg-[#111111]" : "bg-[#F3F3F3]"}`} />}
        </div>
      ))}
    </div>
  );
}

export function ProductCard({ product, onAddToBasket }) {
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <div className="group border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-40 overflow-hidden bg-[#FAFAFA]">
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {product.priceDropped && <span className="absolute top-2.5 left-2.5 text-[10px] uppercase bg-white/95 border border-[#E5E5E5] text-[#111111] px-2 py-1 rounded-full">Price dropped</span>}
        {product.stock === "low-stock" && <span className="absolute top-2.5 left-2.5 text-[10px] uppercase bg-white/95 border border-red-200 text-red-600 px-2 py-1 rounded-full">Low stock</span>}
        <button type="button" onClick={() => setWishlisted((v) => !v)} aria-label="Toggle wishlist" className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 border border-[#E5E5E5] flex items-center justify-center text-sm transition-colors ${wishlisted ? "text-[#C9A227]" : "text-[#6B6B6B]"}`}>
          {wishlisted ? "♥" : "♡"}
        </button>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-medium text-[#111111] truncate">{product.name}</p>
        <p className="text-xs text-[#6B6B6B] mb-1.5">{product.seller}</p>
        <p className="text-xs text-[#C9A227] mb-2">★ {product.rating}</p>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-semibold text-[#111111]">${product.price}</span>
            {product.oldPrice && <span className="text-xs text-[#B0B0B0] line-through ml-1.5">${product.oldPrice}</span>}
          </div>
          <button type="button" onClick={() => onAddToBasket?.(product)} className="text-[11px] font-medium bg-[#111111] text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-all duration-200">Add</button>
        </div>
      </div>
    </div>
  );
}
export function CustomerLayout() {
  const { user, logout } = useAuth();
  const { totalCount, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside(menuOpen, () => setMenuOpen(false));

  const navSections = [
    {
      label: "Shopping", items: [
        { key: "overview", label: "Overview", path: "/customer" },
        { key: "orders", label: "Orders", path: "/customer/orders" },
        // { key: "reviews", label: "Reviews", path: "/customer/reviews" },
      ]
    },
    {
      label: "Account", items: [
        // { key: "addresses", label: "Addresses", path: "/customer/addresses" },
        { key: "settings", label: "Settings", path: "/customer/settings" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block border-r border-[#E5E5E5] bg-white h-screen sticky top-0 px-4 py-6">
          <Link to="/" className="block px-2 mb-8 font-serif text-lg text-[#111111]">Marketplace</Link>
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="px-2 text-[11px] uppercase tracking-wider text-[#B0B0B0] mb-2">{section.label}</p>
              <nav className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.key} to={item.path} end={item.path === "/customer"}
                    className={({ isActive }) => `px-3 py-2 rounded-xl text-sm transition-colors duration-200 ${isActive ? "bg-[#FBF6E9] text-[#111111] font-medium" : "text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111]"}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
              <Link to="/" className="lg:hidden font-serif text-lg text-[#111111]">Marketplace</Link>

              <div className="hidden md:flex flex-1 max-w-md">
                <input type="text" placeholder="Search orders, products, sellers..." className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <Link to="/customer/wishlist" aria-label="Wishlist" className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">♡</Link>
                <button onClick={openDrawer} aria-label="Cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">
                  🛍️
                  {totalCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">{totalCount}</span>}
                </button>
                <Link to="/customer/notifications" aria-label="Notifications" className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors">🔔</Link>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Account menu"
                    className="w-9 h-9 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center"
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E5E5] rounded-2xl shadow-md py-2 animate-fade-slide-up z-30">
                      <div className="px-4 py-2.5 border-b border-[#E5E5E5]">
                        <p className="text-sm font-medium text-[#111111] truncate">{user?.name}</p>
                        <p className="text-xs text-[#6B6B6B] truncate">{user?.email}</p>
                      </div>
                      <Link to="/customer/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Profile</Link>
                      <Link to="/customer/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Settings</Link>
                      <Link to="/customer/addresses" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Addresses</Link>
                      <Link to="/customer/reviews" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Reviews</Link>
                      <button className="block w-full text-left px-4 py-2.5 text-sm text-[#111111] hover:bg-[#FAFAFA]">Help & Support</button>
                      <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Log out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-6xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E5E5E5] flex items-stretch px-1">
        {[
          { label: "Home", path: "/customer" }, { label: "Orders", path: "/customer/orders" },
          { label: "Wishlist", path: "/customer/wishlist" }, { label: "Account", path: "/customer/settings" },
        ].map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === "/customer"} className={({ isActive }) => `flex-1 flex flex-col items-center justify-center py-2.5 text-[11px] transition-colors duration-200 ${isActive ? "text-[#111111] font-medium" : "text-[#6B6B6B]"}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function CustomerDashboardHome() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const items = mockBasket.flatMap((g) => g.items);
  const basketTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const maxInsight = Math.max(...mockInsights.monthly);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">{greeting}, {firstName} 👋</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Here's an overview of your shopping activity.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/customer/orders" className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">Total Orders</p>
          <p className="text-2xl font-serif text-[#111111]">{mockDashboardStats.totalOrders.value}</p>
          <p className="text-xs text-[#6B6B6B] mt-1">{mockDashboardStats.totalOrders.note}</p>
        </Link>
        <Link to="/customer/wishlist" className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">Wishlist</p>
          <p className="text-2xl font-serif text-[#111111]">{mockDashboardStats.wishlist.value}</p>
          <p className="text-xs text-[#6B6B6B] mt-1">{mockDashboardStats.wishlist.note}</p>
        </Link>
        <Link to="/customer/basket" className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">Basket</p>
          <p className="text-2xl font-serif text-[#111111]">{mockDashboardStats.basket.value} items</p>
          <p className="text-xs text-[#6B6B6B] mt-1">{mockDashboardStats.basket.note}</p>
        </Link>
        <Link to="/customer/reviews" className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">Reviews</p>
          <p className="text-2xl font-serif text-[#111111]">{mockDashboardStats.reviews.value}</p>
          <p className="text-xs text-[#6B6B6B] mt-1">{mockDashboardStats.reviews.note}</p>
        </Link>
      </div>

      <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-[#111111]">Active Order — {mockActiveOrder.id}</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">{mockActiveOrder.itemsSummary}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/customer/orders" className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Track Order</Link>
            <Link to={`/customer/orders/${mockActiveOrder.id}`} className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all">View Order</Link>
          </div>
        </div>
        <OrderTimeline status={mockActiveOrder.status} />
        <p className="text-xs text-[#6B6B6B] mt-5">Estimated delivery <span className="text-[#111111] font-medium">{mockActiveOrder.estimatedDelivery}</span> via {mockActiveOrder.carrier}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-0">
              <p className="text-sm font-medium text-[#111111]">Recent Orders</p>
              <Link to="/customer/orders" className="text-xs text-[#C9A227] hover:underline">View All Orders</Link>
            </div>
            <div className="hidden sm:block overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
                    <th className="py-2.5 px-5 font-medium">Order</th>
                    <th className="py-2.5 px-2 font-medium">Date</th>
                    <th className="py-2.5 px-2 font-medium">Items</th>
                    <th className="py-2.5 px-2 font-medium">Total</th>
                    <th className="py-2.5 px-2 font-medium">Status</th>
                    <th className="py-2.5 px-5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.slice(0, 4).map((order) => (
                    <tr key={order.id} className="border-b border-[#E5E5E5] last:border-0">
                      <td className="py-3 px-5 text-[#111111] font-medium">{order.id}</td>
                      <td className="py-3 px-2 text-[#6B6B6B]">{order.date}</td>
                      <td className="py-3 px-2 text-[#6B6B6B]">{order.items}</td>
                      <td className="py-3 px-2 text-[#111111]">${order.total.toFixed(2)}</td>
                      <td className="py-3 px-2"><StatusBadge status={order.status} /></td>
                      <td className="py-3 px-5 text-right"><Link to={`/customer/orders/${order.id}`} className="text-xs text-[#C9A227] hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden p-5 pt-4 space-y-3">
              {mockOrders.slice(0, 4).map((order) => (
                <Link key={order.id} to={`/customer/orders/${order.id}`} className="flex items-center justify-between text-xs border border-[#E5E5E5] rounded-xl p-3">
                  <div><p className="font-medium text-[#111111]">{order.id}</p><p className="text-[#6B6B6B] mt-0.5">{order.date}</p></div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-sm font-medium text-[#111111] mb-4">Your Shopping Activity</p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div><p className="text-lg font-serif text-[#111111]">${mockInsights.totalSpent}</p><p className="text-[11px] text-[#6B6B6B]">Total Spent</p></div>
              <div><p className="text-lg font-serif text-[#111111]">{mockInsights.orders}</p><p className="text-[11px] text-[#6B6B6B]">Orders</p></div>
              <div><p className="text-lg font-serif text-[#111111]">{mockInsights.productsPurchased}</p><p className="text-[11px] text-[#6B6B6B]">Products</p></div>
            </div>
            <div className="flex items-end gap-2 h-16">
              {mockInsights.monthly.map((v, i) => (
                <div key={i} className="flex-1 bg-[#FBF6E9] rounded-t-md transition-all duration-300 hover:bg-[#C9A227]/30" style={{ height: `${(v / maxInsight) * 100}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#111111]">Your Basket</p>
              <span className="text-xs text-[#6B6B6B]">{items.length} items</span>
            </div>
            <ul className="space-y-2.5 mb-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#111111] truncate pr-2">{item.name}</span>
                  <span className="text-[#6B6B6B] shrink-0">${item.price}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-sm font-medium text-[#111111] border-t border-[#E5E5E5] pt-3 mb-4">
              <span>Total</span><span>${basketTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Link to="/customer/basket" className="flex-1 text-center text-xs font-medium border border-[#E5E5E5] px-3 py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">View Basket</Link>
              <Link to="/customer/basket" className="flex-1 text-center text-xs font-medium bg-[#111111] text-white px-3 py-2.5 rounded-full hover:opacity-90 transition-all">Checkout</Link>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111111] p-6 text-white">
            <p className="text-[11px] uppercase tracking-wide text-[#C9A227] mb-2">Exclusive for you</p>
            <p className="text-2xl font-serif mb-1">20% off</p>
            <p className="text-xs text-[#B0B0B0] mb-4">Selected accessories, use code ACCESS20</p>
            <Link to="/" className="inline-block text-xs font-medium bg-white text-[#111111] px-4 py-2 rounded-full hover:opacity-90 transition-all">Shop Now</Link>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-[#C9A227] mb-2">Gold Member</p>
            <p className="text-2xl font-serif text-[#111111] mb-1">1,240 pts</p>
            <p className="text-xs text-[#6B6B6B] mb-3">260 points until next level</p>
            <div className="h-1.5 bg-[#F3F3F3] rounded-full overflow-hidden"><div className="h-full bg-[#C9A227] rounded-full" style={{ width: "78%" }} /></div>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-sm font-medium text-[#111111] mb-4">Quick Actions</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Track an Order", to: "/customer/orders" },
                { label: "Browse Products", to: "/" },
                { label: "View Wishlist", to: "/customer/wishlist" },
                { label: "Manage Addresses", to: "/customer/addresses" },
                { label: "Write a Review", to: "/customer/reviews" },
              ].map((a) => (
                <Link key={a.label} to={a.to} className="text-xs text-[#6B6B6B] hover:text-[#111111] px-3 py-2 rounded-xl hover:bg-[#FAFAFA] transition-colors">{a.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[#111111]">Your Wishlist</p>
            <p className="text-xs text-[#6B6B6B]">18 saved items · 4 price changes</p>
          </div>
          <Link to="/customer/wishlist" className="text-xs text-[#C9A227] hover:underline">View Wishlist</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockWishlist.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="mb-8">
        <p className="text-sm font-medium text-[#111111] mb-1">Recommended For You</p>
        <p className="text-xs text-[#6B6B6B] mb-4">Based on your recent purchases</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockProducts.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="mb-8">
        <p className="text-sm font-medium text-[#111111] mb-4">Recently Viewed</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...mockProducts].reverse().slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
        <p className="text-sm font-medium text-[#111111] mb-4">Recent Activity</p>
        <ul className="space-y-3">
          {mockActivity.map((a, i) => (
            <li key={i} className="text-xs"><span className="text-[#B0B0B0]">{a.day}</span><p className="text-[#111111] mt-0.5">{a.text}</p></li>
          ))}
        </ul>
      </div>
    </div>
  );
}