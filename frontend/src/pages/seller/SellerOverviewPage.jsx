import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useOverviewData } from "../../hooks/useOverviewData";
import { getSellerOverview } from "../../services/overviewApi";
import { TrendChart, DonutChart, BarList } from "../../components/charts/charts";
import { Card, CardHeader, StatCard, ErrorBox, DashboardSkeleton } from "../../components/dashboard/dashboardKit";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Icon, SmartImage } from "../../components/marketplace/marketplaceUi";
import { formatPrice } from "../../utils/formatPrice";
import { shortOrderId } from "../../utils/orderUtils";

const STATUS_COLORS = { processing: "#C9A227", shipped: "#2A5DB0", delivered: "#2E7D32", cancelled: "#C0392B" };
const fmtDay = (key, opts) => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, opts);

export function SellerOverviewPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("7");
  const { data, loading, refreshing, error, reload, refresh } = useOverviewData(() => getSellerOverview(range), [range]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif text-[#111111]">Welcome back, {firstName}</h1>
          <p className="text-sm text-[#6B6B6B]">Here is how your store is doing.</p>
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

      {!loading && !error && data && <SellerContent data={data} range={range} setRange={setRange} />}
    </div>
  );
}

function SellerContent({ data, range, setRange }) {
  const { stats, trend, statusBreakdown, topProducts, recentOrders, products } = data;

  const trendData = trend.map((d) => ({
    key: d.date,
    label: range === "30" ? fmtDay(d.date, { day: "numeric", month: "short" }) : d.label,
    title: fmtDay(d.date, { weekday: "short", day: "numeric", month: "short" }),
    value: d.revenue,
    detail: d.orders,
  }));
  const spark = trend.map((d) => d.revenue);

  const donut = Object.entries(statusBreakdown).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] }));
  const donutTotal = donut.reduce((sum, s) => sum + s.value, 0);

  const attention = [
    { label: "waiting for review", value: products.pending, icon: "shield" },
    { label: "rejected", value: products.rejected, icon: "close" },
    { label: "out of stock", value: products.outOfStock, icon: "package" },
    { label: `low stock (${products.lowStockLimit} or fewer)`, value: products.lowStock.length - products.lowStock.filter((p) => p.stock === 0).length, icon: "bag" },
  ].filter((a) => a.value > 0);

  return (
    <>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total sales" icon="tag" value={stats.revenue.total} format={formatPrice} sub={`${formatPrice(stats.revenue.week)} in the last 7 days`} change={stats.revenue.change} spark={spark} delay={0} />
        <StatCard label="Orders" icon="bag" value={stats.orders.total} sub={`${stats.orders.week} in the last 7 days`} change={stats.orders.change} delay={80} />
        <StatCard label="To fulfil" icon="truck" value={stats.orders.toFulfil} sub={stats.orders.toFulfil > 0 ? "Paid orders waiting to ship" : "You are all caught up"} highlight={stats.orders.toFulfil > 0} to="/seller/orders" delay={160} />
        <StatCard label="Live products" icon="package" value={products.live} sub={`${products.total} total · avg order ${formatPrice(stats.averageOrder)}`} to="/seller/products" delay={240} />
      </div>

      {attention.length > 0 && (
        <Card delay={280} className="!p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#111111] mr-1">Needs attention</span>
            {attention.map((a) => (
              <Link key={a.label} to="/seller/products" className="inline-flex items-center gap-1.5 text-xs bg-[#FBF6E9] text-[#8a6f14] border border-[#C9A227]/30 rounded-full px-3 py-1.5 hover:bg-[#F7EDD0] transition-colors">
                <Icon name={a.icon} size={12} /> {a.value} {a.label}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid xl:grid-cols-3 gap-5">
        <Card delay={320} className="xl:col-span-2">
          <CardHeader
            title="Sales"
            subtitle="Paid orders per day"
            action={
              <div role="tablist" className="inline-flex rounded-full border border-[#E5E5E5] bg-[#FAFAFA] p-0.5">
                {[["7", "7 days"], ["30", "30 days"]].map(([value, label]) => (
                  <button key={value} role="tab" aria-selected={range === value} onClick={() => setRange(value)} className={`px-3 py-1 text-xs rounded-full transition-colors ${range === value ? "bg-[#111111] text-white" : "text-[#6B6B6B] hover:text-[#111111]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            }
          />
          <TrendChart key={range} data={trendData} formatValue={formatPrice} formatTick={(v) => formatPrice(Math.round(v))} detailLabel="orders" />
        </Card>

        <Card delay={400}>
          <CardHeader title="Orders by status" subtitle="All paid orders" />
          {donutTotal === 0 ? <p className="text-sm text-[#6B6B6B] py-8 text-center">No orders yet.</p> : <DonutChart segments={donut} centerLabel="orders" />}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card delay={440}>
          <CardHeader title="Best sellers" subtitle="Most units sold" />
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] py-6 text-center">Your best sellers will show up after your first sale.</p>
          ) : (
            <BarList items={topProducts.map((p) => ({ key: p.id, label: p.name, image: p.image, value: p.units, valueLabel: `${p.units} sold`, sub: formatPrice(p.revenue) }))} />
          )}
        </Card>

        <Card delay={480}>
          <CardHeader title="Stock alerts" subtitle={`Products with ${products.lowStockLimit} or fewer left`} action={<Link to="/seller/products" className="text-xs text-[#C9A227] hover:underline">Manage</Link>} />
          {products.lowStock.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] py-6 text-center">Stock levels look healthy.</p>
          ) : (
            <ul className="divide-y divide-[#F0F0F0]">
              {products.lowStock.map((p) => (
                <li key={p.id}>
                  <Link to={`/seller/products/${p.id}/edit`} className="flex items-center gap-3 py-2.5 hover:bg-[#FAFAFA] rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[#F6F4F0] overflow-hidden shrink-0"><SmartImage src={p.image} alt="" className="w-full h-full object-cover" /></div>
                    <p className="flex-1 min-w-0 text-sm text-[#111111] truncate">{p.name}</p>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${p.stock === 0 ? "bg-[#FBEAEA] text-[#C0392B]" : "bg-[#FDF3E3] text-[#B98900]"}`}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card delay={520}>
        <CardHeader title="Recent orders" action={<Link to="/seller/orders" className="text-xs text-[#C9A227] hover:underline">View all</Link>} />
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
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 pr-4"><Link to={`/seller/orders/${o.id}`} className="font-medium text-[#111111] hover:text-[#C9A227]">#{shortOrderId(o.id)}</Link></td>
                      <td className="py-3 pr-4 text-[#6B6B6B]">{o.customer}</td>
                      <td className="py-3 pr-4 text-[#6B6B6B] whitespace-nowrap">{new Date(o.date).toLocaleDateString()}</td>
                      <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-3 text-right font-medium text-[#111111] whitespace-nowrap">{formatPrice(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="md:hidden space-y-3">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to={`/seller/orders/${o.id}`} className="block rounded-xl border border-[#EEEBE4] p-3 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium text-[#111111]">#{shortOrderId(o.id)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6B6B6B]">
                      <span className="truncate">{o.customer} · {new Date(o.date).toLocaleDateString()}</span>
                      <span className="font-medium text-[#111111] shrink-0">{formatPrice(o.amount)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}