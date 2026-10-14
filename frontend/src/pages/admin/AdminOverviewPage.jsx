import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOverview } from "../../services/adminOverviewApi";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { formatPrice } from "../../utils/formatPrice";
import { shortOrderId } from "../../utils/orderUtils";

const card = "bg-white border border-[#E5E5E5] rounded-2xl";
const REFRESH_MS = 60_000;

function Change({ value }) {
  if (value == null) return <span className="text-[#9A968D]">No data for the previous week</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-[#2E7D32]" : "text-[#C0392B]"}>
      {up ? "↑" : "↓"} {Math.abs(value)}% vs previous 7 days
    </span>
  );
}

function StatCard({ label, value, sub, change }) {
  return (
    <div className={`${card} p-5`}>
      <p className="text-xs text-[#6B6B6B] mb-2">{label}</p>
      <p className="text-2xl font-serif text-[#111111] mb-1">{value}</p>
      <p className="text-[11px] text-[#6B6B6B] mb-1">{sub}</p>
      <p className="text-xs font-medium"><Change value={change} /></p>
    </div>
  );
}

const CURRENCY = import.meta.env.VITE_CURRENCY || "USD";
const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, notation: "compact", maximumFractionDigits: 1 });

function smoothPath(points) {
  return points.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const mid = (prev.x + p.x) / 2;
    return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}

function RevenueChart({ trend }) {
  const [hover, setHover] = useState(null);

  const n = trend.length;
  const max = Math.max(...trend.map((d) => d.revenue), 1); // never divide by zero on a quiet week
  const weekTotal = trend.reduce((sum, d) => sum + d.revenue, 0);

  const X_PAD = 5;
  const xOf = (i) => (n > 1 ? X_PAD + (i * (100 - X_PAD * 2)) / (n - 1) : 50);
  const yOf = (v) => 88 - (v / max) * 72; // 88% = baseline, 16% = top
  const step = n > 1 ? (100 - X_PAD * 2) / (n - 1) : 100;

  const points = trend.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.revenue) }));
  const line = smoothPath(points);
  const area = `${line} L ${points[n - 1].x} 88 L ${points[0].x} 88 Z`;
  const ticks = [0, 1, 2, 3].map((i) => (max * i) / 3);
  const active = hover != null ? points[hover] : null;

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="mb-5">
        <p className="text-sm font-medium text-[#111111]">Revenue Overview</p>
        <p className="text-xs text-[#6B6B6B]">Last 7 days · {formatPrice(weekTotal)} in paid orders</p>
      </div>

      <div className="relative h-48 ml-10 mr-2">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-[#EEEBE4]" style={{ top: `${yOf(t)}%` }}>
            <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[10px] text-[#9A968D]">{compactMoney.format(t)}</span>
          </div>
        ))}

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-reveal absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A227" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#revFill)" />
          <path d={line} fill="none" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {active && <div className="absolute top-0 bottom-0 w-px bg-[#C9A227]/40 pointer-events-none" style={{ left: `${active.x}%` }} />}

        {points.map((p, i) => (
          <span
            key={p.date}
            className="chart-dot absolute w-2 h-2 rounded-full bg-[#111111] pointer-events-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.12}s` }}
          />
        ))}

        {active && (
          <span
            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-[#C9A227] shadow pointer-events-none"
            style={{ left: `${active.x}%`, top: `${active.y}%` }}
          />
        )}

        {/* Invisible hover/focus zones, one per day */}
        {points.map((p, i) => {
          const left = Math.max(0, p.x - step / 2);
          const right = Math.min(100, p.x + step / 2);
          return (
            <button
              key={p.date}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${p.label} ${p.date}: ${formatPrice(p.revenue)}, ${p.orders} ${p.orders === 1 ? "order" : "orders"}`}
              className="absolute top-0 bottom-0 cursor-crosshair focus-visible:outline-none"
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          );
        })}

        {active && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full pb-3 pointer-events-none"
            style={{ left: `${Math.min(Math.max(active.x, 14), 86)}%`, top: `${active.y}%` }}
          >
            <div className="chart-tip relative bg-white border border-[#E8E5DF] rounded-xl shadow-lg px-3.5 py-2.5 min-w-[130px]">
              <p className="text-[10px] uppercase tracking-wide text-[#9A968D]">
                {active.label}, {new Date(`${active.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="font-serif text-lg text-[#111111] leading-tight mt-0.5">{formatPrice(active.revenue)}</p>
              <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                {active.orders} {active.orders === 1 ? "order" : "orders"}
              </p>
              <span className="absolute left-1/2 -bottom-1 w-2 h-2 -translate-x-1/2 rotate-45 bg-white border-r border-b border-[#E8E5DF]" />
            </div>
          </div>
        )}
      </div>

      <div className="relative h-5 mt-2 ml-10 mr-2">
        {points.map((p) => (
          <span key={p.date} className="absolute -translate-x-1/2 text-[10px] text-[#9A968D]" style={{ left: `${p.x}%` }}>{p.label}</span>
        ))}
      </div>

      {weekTotal === 0 && <p className="text-xs text-[#6B6B6B] text-center mt-3">No paid orders in the last 7 days.</p>}
    </div>
  );
}
function RecentOrders({ orders }) {
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111111]">Recent Orders</p>
        <Link to="/admin/orders" className="text-xs text-[#C9A227] hover:underline">View all</Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-[#6B6B6B] py-6 text-center">No paid orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#9A968D] border-b border-[#E5E5E5]">
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Seller</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="py-3 pr-4 text-[#111111] font-medium whitespace-nowrap">#{shortOrderId(o.id)}</td>
                  <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{o.customer}</td>
                  <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{o.seller}</td>
                  <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="py-3 text-right text-[#111111] font-medium whitespace-nowrap">{formatPrice(o.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PendingApprovals({ pending }) {
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111111]">Pending Approvals</p>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FBF6E9] text-[#8a6f14] font-medium">{pending.total}</span>
      </div>

      {pending.products.length === 0 ? (
        <p className="text-sm text-[#6B6B6B]">Nothing is waiting for review.</p>
      ) : (
        <div className="space-y-3">
          {pending.products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-[#111111] truncate">{p.name}</p>
                <p className="text-[11px] text-[#9A968D] truncate">{p.seller} · {new Date(p.submittedOn).toLocaleDateString()}</p>
              </div>
              <Link to="/admin/products" className="text-xs text-[#C9A227] hover:underline shrink-0">Review</Link>
            </div>
          ))}
          {pending.total > pending.products.length && (
            <Link to="/admin/products" className="block text-xs text-[#6B6B6B] hover:text-[#111111]">
              +{pending.total - pending.products.length} more waiting
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function TopSellers({ sellers }) {
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <p className="text-sm font-medium text-[#111111] mb-1">Top Sellers</p>
      <p className="text-[11px] text-[#9A968D] mb-4">By paid sales, all time</p>
      {sellers.length === 0 ? (
        <p className="text-sm text-[#6B6B6B]">No sales yet.</p>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <Avatar name={s.name} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#111111] truncate">{s.name}</p>
                <p className="text-[11px] text-[#9A968D]">{s.orders} {s.orders === 1 ? "order" : "orders"}</p>
              </div>
              <p className="text-sm font-medium text-[#111111]">{formatPrice(s.revenue)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketplaceHealth({ health }) {
  const rows = [
    { label: "Orders awaiting payment", value: health.awaitingPayment, to: "/admin/orders", warn: false },
    { label: "Out-of-stock listings", value: health.outOfStock, to: "/admin/products", warn: health.outOfStock > 0 },
    { label: `Low stock (${health.lowStockLimit} or fewer)`, value: health.lowStock, to: "/admin/products", warn: health.lowStock > 0 },
    { label: "Suspended accounts", value: health.suspended, to: "/admin/users", warn: health.suspended > 0 },
  ];
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111111]">Marketplace Health</p>
        <span className="text-[11px] text-[#6B6B6B]">{health.published} live products</span>
      </div>
      <ul className="divide-y divide-[#F0F0F0]">
        {rows.map((r) => (
          <li key={r.label}>
            <Link to={r.to} className="flex items-center justify-between py-2.5 text-sm hover:text-[#C9A227] transition-colors">
              <span className="text-[#4B5260]">{r.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.warn ? "bg-[#FBF6E9] text-[#8a6f14]" : "bg-[#F0F0F0] text-[#6B6B6B]"}`}>{r.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading overview" className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${card} h-28`} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className={`${card} h-64`} />
          <div className={`${card} h-64`} />
        </div>
        <div className="space-y-5">
          <div className={`${card} h-52`} />
          <div className={`${card} h-52`} />
        </div>
      </div>
    </div>
  );
}

export function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getAdminOverview();
      setData(res.data);
      setError("");
    } catch (err) {
      // a failed background refresh keeps the last good numbers on screen
      if (!silent) setError(err.message || "Failed to load the overview.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh every minute, but only while the tab is visible.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true });
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const stats = data?.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif text-[#111111]">Overview</h1>
          <p className="text-sm text-[#6B6B6B]">Marketplace activity across all sellers and customers.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && <p className="text-[11px] text-[#9A968D]">Updated {new Date(data.generatedAt).toLocaleTimeString()}</p>}
          <button
            onClick={() => load({ silent: true })}
            disabled={loading || refreshing}
            className="text-xs font-medium border border-[#E5E5E5] bg-white px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && <OverviewSkeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={() => load()} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Gross sales" value={formatPrice(stats.revenue.total)} sub={`${formatPrice(stats.revenue.week)} in the last 7 days`} change={stats.revenue.change} />
            <StatCard label="Orders" value={stats.orders.total} sub={`${stats.orders.week} in the last 7 days`} change={stats.orders.change} />
            <StatCard label="Customers" value={stats.customers.total} sub={`${stats.customers.week} joined in the last 7 days`} change={stats.customers.change} />
            <StatCard label="Sellers" value={stats.sellers.total} sub={`${stats.sellers.week} joined in the last 7 days`} change={stats.sellers.change} />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <RevenueChart trend={data.trend} />
              <RecentOrders orders={data.recentOrders} />
            </div>
            <div className="space-y-5">
              <PendingApprovals pending={data.pending} />
              <MarketplaceHealth health={data.health} />
              <TopSellers sellers={data.topSellers} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}