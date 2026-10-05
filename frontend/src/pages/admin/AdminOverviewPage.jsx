import { Link } from "react-router-dom";
import {
  adminStats, revenueTrend, recentOrders, pendingApprovals, topSellers,
} from "../../data/adminDashboardData";

function StatCard({ label, value, change, trend }) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5">
      <p className="text-xs text-[#6B6B6B] mb-2">{label}</p>
      <p className="text-2xl font-serif text-[#111111] mb-1">{value}</p>
      <p className={`text-xs font-medium ${trend === "up" ? "text-[#2E7D32]" : "text-[#C0392B]"}`}>
        {trend === "up" ? "↑" : "↓"} {change} vs last week
      </p>
    </div>
  );
}

function RevenueChart() {
  const w = 600, h = 180, pad = 10;
  const max = Math.max(...revenueTrend.map((d) => d.value));
  const step = (w - pad * 2) / (revenueTrend.length - 1);
  const points = revenueTrend.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, label: d.label };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[#111111]">Revenue Overview</p>
          <p className="text-xs text-[#6B6B6B]">Last 7 days</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#6B6B6B]">This week</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A227" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#revFill)" />
        <path d={linePath} fill="none" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3" fill="#111111" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {revenueTrend.map((d) => (
          <span key={d.label} className="text-[10px] text-[#B0B0B0]">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function statusStyle(status) {
  const map = {
    paid: "bg-[#EAF7ED] text-[#2E7D32]",
    pending: "bg-[#FDF3E3] text-[#B98900]",
    shipped: "bg-[#EAF1FB] text-[#2A5DB0]",
  };
  return map[status] || "bg-[#F0F0F0] text-[#6B6B6B]";
}

function RecentOrders() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111111]">Recent Orders</p>
        <Link to="/admin/orders" className="text-xs text-[#C9A227] hover:underline">View all</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
              <th className="py-2 pr-4 font-medium">Order</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Seller</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-0 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-[#F0F0F0] last:border-0">
                <td className="py-3 pr-4 text-[#111111] font-medium whitespace-nowrap">{o.id}</td>
                <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{o.customer}</td>
                <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{o.seller}</td>
                <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{o.date}</td>
                <td className="py-3 pr-4">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize ${statusStyle(o.status)}`}>{o.status}</span>
                </td>
                <td className="py-3 pr-0 text-right text-[#111111] font-medium whitespace-nowrap">${o.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingApprovals() {
  const total = pendingApprovals.sellers.length + pendingApprovals.products.length;
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111111]">Pending Approvals</p>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FBF6E9] text-[#C9A227] font-medium">{total}</span>
      </div>

      <p className="text-[11px] uppercase tracking-wide text-[#B0B0B0] mb-2">Sellers</p>
      <div className="space-y-2 mb-4">
        {pendingApprovals.sellers.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="text-[#111111]">{s.name}</p>
              <p className="text-[11px] text-[#B0B0B0]">Applied {s.appliedOn}</p>
            </div>
            <Link to="/admin/sellers" className="text-xs text-[#C9A227] hover:underline">Review</Link>
          </div>
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-wide text-[#B0B0B0] mb-2">Products</p>
      <div className="space-y-2">
        {pendingApprovals.products.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="text-[#111111]">{p.name}</p>
              <p className="text-[11px] text-[#B0B0B0]">{p.seller} · {p.submittedOn}</p>
            </div>
            <Link to="/admin/products" className="text-xs text-[#C9A227] hover:underline">Review</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopSellers() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6">
      <p className="text-sm font-medium text-[#111111] mb-4">Top Sellers</p>
      <div className="space-y-3">
        {topSellers.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <img src={s.image} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-[#E5E5E5]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#111111] truncate">{s.name}</p>
              <p className="text-[11px] text-[#B0B0B0]">{s.revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOverviewPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Overview</h1>
        <p className="text-sm text-[#6B6B6B]">Marketplace activity across all sellers and customers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <RevenueChart />
          <RecentOrders />
        </div>
        <div className="space-y-5">
          <PendingApprovals />
          <TopSellers />
        </div>
      </div>
    </div>
  );
}