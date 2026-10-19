// 
import { Link } from "react-router-dom";
import { getAdminOverview } from "../../services/adminOverviewApi";
import { useOverviewData } from "../../hooks/useOverviewData";
import { TrendChart } from "../../components/charts/charts";
import { Card, CardHeader, StatCard, ErrorBox, DashboardSkeleton } from "../../components/dashboard/dashboardKit";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { formatPrice } from "../../utils/formatPrice";
import { shortOrderId } from "../../utils/orderUtils";

const fmtDay = (key, opts) => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, opts);

export function AdminOverviewPage() {
  const { data, loading, refreshing, error, reload, refresh } = useOverviewData(getAdminOverview, []);

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif text-[#111111]">Overview</h1>
          <p className="text-sm text-[#6B6B6B]">Marketplace activity across all sellers and customers.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && <p className="hidden sm:block text-[11px] text-[#9A968D]">Updated {new Date(data.generatedAt).toLocaleTimeString()}</p>}
          <button onClick={refresh} disabled={loading || refreshing} className="text-xs font-medium border border-[#E5E5E5] bg-white px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && <DashboardSkeleton />}
      {!loading && error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && data && <AdminContent data={data} />}
    </div>
  );
}

function AdminContent({ data }) {
  const { stats, trend, recentOrders, pending, topSellers, health } = data;

  const trendData = trend.map((d) => ({
    key: d.date,
    label: d.label,
    title: fmtDay(d.date, { weekday: "short", day: "numeric", month: "short" }),
    value: d.revenue,
    detail: d.orders,
  }));
  const weekTotal = trend.reduce((sum, d) => sum + d.revenue, 0);

  const healthRows = [
    { label: "Orders awaiting payment", value: health.awaitingPayment, to: "/admin/orders", warn: false },
    { label: "Out-of-stock listings", value: health.outOfStock, to: "/admin/products", warn: health.outOfStock > 0 },
    { label: `Low stock (${health.lowStockLimit} or fewer)`, value: health.lowStock, to: "/admin/products", warn: health.lowStock > 0 },
    { label: "Suspended accounts", value: health.suspended, to: "/admin/users", warn: health.suspended > 0 },
  ];

  return (
    <>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Gross sales" icon="tag" value={stats.revenue.total} format={formatPrice} sub={`${formatPrice(stats.revenue.week)} in the last 7 days`} change={stats.revenue.change} spark={trend.map((d) => d.revenue)} delay={0} />
        <StatCard label="Orders" icon="bag" value={stats.orders.total} sub={`${stats.orders.week} in the last 7 days`} change={stats.orders.change} to="/admin/orders" delay={80} />
        <StatCard label="Customers" icon="heart" value={stats.customers.total} sub={`${stats.customers.week} joined in the last 7 days`} change={stats.customers.change} to="/admin/users" delay={160} />
        <StatCard label="Sellers" icon="store" value={stats.sellers.total} sub={`${stats.sellers.week} joined in the last 7 days`} change={stats.sellers.change} to="/admin/sellers" delay={240} />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5 min-w-0">
          <Card delay={300}>
            <CardHeader title="Revenue overview" subtitle={`Last 7 days · ${formatPrice(weekTotal)} in paid orders`} />
            <TrendChart data={trendData} formatValue={formatPrice} formatTick={(v) => formatPrice(Math.round(v))} detailLabel="orders" />
          </Card>

          <Card delay={380}>
            <CardHeader title="Recent orders" action={<Link to="/admin/orders" className="text-xs text-[#C9A227] hover:underline">View all</Link>} />
            {recentOrders.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] py-6 text-center">No paid orders yet.</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
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
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-3 pr-4 text-[#111111] font-medium whitespace-nowrap">#{shortOrderId(o.id)}</td>
                          <td className="py-3 pr-4 text-[#6B6B6B]">{o.customer}</td>
                          <td className="py-3 pr-4 text-[#6B6B6B]">{o.seller}</td>
                          <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{new Date(o.date).toLocaleDateString()}</td>
                          <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                          <td className="py-3 text-right text-[#111111] font-medium whitespace-nowrap">{formatPrice(o.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="md:hidden space-y-3">
                  {recentOrders.map((o) => (
                    <li key={o.id} className="rounded-xl border border-[#EEEBE4] p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-[#111111]">#{shortOrderId(o.id)}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-[#6B6B6B] truncate">{o.customer} → {o.seller}</p>
                      <div className="flex items-center justify-between text-xs mt-1.5">
                        <span className="text-[#9A968D]">{new Date(o.date).toLocaleDateString()}</span>
                        <span className="font-medium text-[#111111]">{formatPrice(o.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-5 min-w-0">
          <Card delay={340}>
            <CardHeader title="Pending approvals" action={<span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FBF6E9] text-[#8a6f14] font-medium">{pending.total}</span>} />
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
                {pending.total > pending.products.length && <Link to="/admin/products" className="block text-xs text-[#6B6B6B] hover:text-[#111111]">+{pending.total - pending.products.length} more waiting</Link>}
              </div>
            )}
          </Card>

          <Card delay={420}>
            <CardHeader title="Marketplace health" action={<span className="text-[11px] text-[#6B6B6B]">{health.published} live products</span>} />
            <ul className="divide-y divide-[#F0F0F0]">
              {healthRows.map((r) => (
                <li key={r.label}>
                  <Link to={r.to} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-[#C9A227] transition-colors">
                    <span className="text-[#4B5260] min-w-0 truncate">{r.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${r.warn ? "bg-[#FBF6E9] text-[#8a6f14]" : "bg-[#F0F0F0] text-[#6B6B6B]"}`}>{r.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={500}>
            <CardHeader title="Top sellers" subtitle="By paid sales, all time" />
            {topSellers.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {topSellers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Avatar name={s.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111111] truncate">{s.name}</p>
                      <p className="text-[11px] text-[#9A968D]">{s.orders} {s.orders === 1 ? "order" : "orders"}</p>
                    </div>
                    <p className="text-sm font-medium text-[#111111] shrink-0">{formatPrice(s.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}