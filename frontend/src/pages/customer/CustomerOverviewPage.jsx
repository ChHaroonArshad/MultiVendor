import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { StatusBadge } from "../../components/customer/StatusBadge";
import { OrderTimeline } from "../../components/customer/OrderTimeline";
import { ProductCard } from "../../components/customer/ProductCard";
import {
  mockDashboardStats, mockActiveOrder, mockOrders, mockWishlist,
  mockProducts, mockBasket, mockActivity, mockInsights,
} from "../../data/customerMockData";

function StatCard({ label, value, note, to }) {
  return (
    <Link to={to} className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm block">
      <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">{label}</p>
      <p className="text-2xl font-serif text-[#111111]">{value}</p>
      <p className="text-xs text-[#6B6B6B] mt-1">{note}</p>
    </Link>
  );
}

function InsightsCard() {
  const max = Math.max(...mockInsights.monthly);
  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
      <p className="text-sm font-medium text-[#111111] mb-4">Your Shopping Activity</p>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div><p className="text-lg font-serif text-[#111111]">${mockInsights.totalSpent}</p><p className="text-[11px] text-[#6B6B6B]">Total Spent</p></div>
        <div><p className="text-lg font-serif text-[#111111]">{mockInsights.orders}</p><p className="text-[11px] text-[#6B6B6B]">Orders</p></div>
        <div><p className="text-lg font-serif text-[#111111]">{mockInsights.productsPurchased}</p><p className="text-[11px] text-[#6B6B6B]">Products</p></div>
      </div>
      <div className="flex items-end gap-2 h-16">
        {mockInsights.monthly.map((v, i) => (
          <div key={i} className="flex-1 bg-[#FBF6E9] rounded-t-md transition-all duration-300 hover:bg-[#C9A227]/30" style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

function BasketPreview() {
  const items = mockBasket.flatMap((g) => g.items);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
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
        <span>Total</span><span>${total.toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <Link to="/customer/basket" className="flex-1 text-center text-xs font-medium border border-[#E5E5E5] px-3 py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">View Basket</Link>
        <Link to="/customer/basket" className="flex-1 text-center text-xs font-medium bg-[#111111] text-white px-3 py-2.5 rounded-full hover:opacity-90 transition-all">Checkout</Link>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Track an Order", to: "/customer/orders" },
    { label: "Browse Products", to: "/" },
    { label: "View Wishlist", to: "/customer/wishlist" },
    { label: "Manage Addresses", to: "/customer/addresses" },
    { label: "Write a Review", to: "/customer/reviews" },
  ];
  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
      <p className="text-sm font-medium text-[#111111] mb-4">Quick Actions</p>
      <div className="flex flex-col gap-1.5">
        {actions.map((a) => (
          <Link key={a.label} to={a.to} className="text-xs text-[#6B6B6B] hover:text-[#111111] px-3 py-2 rounded-xl hover:bg-[#FAFAFA] transition-colors">{a.label}</Link>
        ))}
      </div>
    </div>
  );
}

function PromotionCard() {
  return (
    <div className="rounded-2xl bg-[#111111] p-6 text-white">
      <p className="text-[11px] uppercase tracking-wide text-[#C9A227] mb-2">Exclusive for you</p>
      <p className="text-2xl font-serif mb-1">20% off</p>
      <p className="text-xs text-[#B0B0B0] mb-4">Selected accessories, use code ACCESS20</p>
      <Link to="/" className="inline-block text-xs font-medium bg-white text-[#111111] px-4 py-2 rounded-full hover:opacity-90 transition-all">Shop Now</Link>
    </div>
  );
}

function MembershipCard() {
  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
      <p className="text-[11px] uppercase tracking-wide text-[#C9A227] mb-2">Gold Member</p>
      <p className="text-2xl font-serif text-[#111111] mb-1">1,240 pts</p>
      <p className="text-xs text-[#6B6B6B] mb-3">260 points until next level</p>
      <div className="h-1.5 bg-[#F3F3F3] rounded-full overflow-hidden">
        <div className="h-full bg-[#C9A227] rounded-full" style={{ width: "78%" }} />
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
      <p className="text-sm font-medium text-[#111111] mb-4">Recent Activity</p>
      <ul className="space-y-3">
        {mockActivity.map((a, i) => (
          <li key={i} className="text-xs">
            <span className="text-[#B0B0B0]">{a.day}</span>
            <p className="text-[#111111] mt-0.5">{a.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentOrdersTable() {
  return (
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
            <div>
              <p className="font-medium text-[#111111]">{order.id}</p>
              <p className="text-[#6B6B6B] mt-0.5">{order.date}</p>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CustomerOverviewPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">{greeting}, {firstName} 👋</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Here's an overview of your shopping activity.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={mockDashboardStats.totalOrders.value} note={mockDashboardStats.totalOrders.note} to="/customer/orders" />
        <StatCard label="Wishlist" value={mockDashboardStats.wishlist.value} note={mockDashboardStats.wishlist.note} to="/customer/wishlist" />
        <StatCard label="Basket" value={`${mockDashboardStats.basket.value} items`} note={mockDashboardStats.basket.note} to="/customer/basket" />
        <StatCard label="Reviews" value={mockDashboardStats.reviews.value} note={mockDashboardStats.reviews.note} to="/customer/reviews" />
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
        <p className="text-xs text-[#6B6B6B] mt-5">
          Estimated delivery <span className="text-[#111111] font-medium">{mockActiveOrder.estimatedDelivery}</span> via {mockActiveOrder.carrier}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <RecentOrdersTable />
          <InsightsCard />
        </div>
        <div className="space-y-6">
          <BasketPreview />
          <PromotionCard />
          <MembershipCard />
          <QuickActions />
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

      <RecentActivity />
    </div>
  );
}