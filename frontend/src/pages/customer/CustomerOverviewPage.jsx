import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useOverviewData } from "../../hooks/useOverviewData";
import { getCustomerOverview } from "../../services/overviewApi";
import { TrendChart, DonutChart } from "../../components/charts/charts";
import { Card, CardHeader, StatCard, ErrorBox, DashboardSkeleton } from "../../components/dashboard/dashboardKit";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Icon, SmartImage } from "../../components/marketplace/marketplaceUi";
import { formatPrice } from "../../utils/formatPrice";
import { getRecentlyViewed } from "../../utils/recentlyViewed";

const STATUS_COLORS = { processing: "#C9A227", shipped: "#2A5DB0", delivered: "#2E7D32", cancelled: "#C0392B" };

function PayCountdown({ payBy }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, new Date(payBy).getTime() - now);
  if (left === 0) return <span className="text-[#C0392B]">hold expired</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="tabular-nums">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")} left</span>;
}

function OrderRow({ o }) {
  return (
    <Link to={`/customer/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-[#FAFAFA] rounded-xl px-2 -mx-2 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-[#F6F4F0] overflow-hidden shrink-0"><SmartImage src={o.image} alt="" className="w-full h-full object-cover" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#111111] truncate">{o.name}{o.itemCount > 1 ? ` +${o.itemCount - 1} more` : ""}</p>
        <p className="text-[11px] text-[#9A968D] truncate">{o.seller} · {new Date(o.date).toLocaleDateString()}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-[#111111]">{formatPrice(o.amount)}</p>
        <div className="mt-1"><OrderStatusBadge status={o.status} /></div>
      </div>
    </Link>
  );
}

export function CustomerOverviewPage() {
  const { user } = useAuth();
  const { openDrawer } = useCart();
  const { data, loading, refreshing, error, reload, refresh } = useOverviewData(getCustomerOverview, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif text-[#111111]">Hello, {firstName}</h1>
          <p className="text-sm text-[#6B6B6B]">Your orders and spending at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading || refreshing} className="text-xs font-medium border border-[#E5E5E5] bg-white px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link to="/products" className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all">Continue shopping</Link>
        </div>
      </div>

      {loading && <DashboardSkeleton />}
      {!loading && error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && data && <CustomerContent data={data} openCart={openDrawer} />}
    </div>
  );
}

function CustomerContent({ data, openCart }) {
  const { stats, spending, statusBreakdown, recentOrders, onTheWay, awaitingPayment } = data;
  const recentlyViewed = getRecentlyViewed().slice(0, 6);

  const spendData = spending.map((m) => ({ key: m.key, label: m.label, title: m.title, value: m.spent, detail: m.orders }));
  const spark = spending.map((m) => m.spent);
  const donut = Object.entries(statusBreakdown).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] }));
  const donutTotal = donut.reduce((sum, s) => sum + s.value, 0);

  return (
    <>
      {awaitingPayment.map((g) => (
        <div key={g.orderId} className="rise-in rounded-2xl border border-[#C9A227]/50 bg-[#FFFBEF] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <span className="w-10 h-10 rounded-full bg-[#C9A227] text-white flex items-center justify-center shrink-0 pulse-ring"><Icon name="bag" size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#111111]">Complete your payment of {formatPrice(g.total)}</p>
            <p className="text-xs text-[#6B6B6B]">{g.items} {g.items === 1 ? "item is" : "items are"} being held for you, <PayCountdown payBy={g.payBy} /></p>
          </div>
          <Link to={`/customer/orders/${g.orderId}?pay=1`} className="text-xs font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full text-center hover:opacity-90 transition-all">Pay now</Link>
        </div>
      ))}

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total spent" icon="tag" value={stats.totalSpent} format={formatPrice} sub={`${formatPrice(stats.thisMonth)} this month`} change={stats.monthChange} changeSuffix="vs last month" spark={spark} delay={0} />
        <StatCard label="Orders" icon="bag" value={stats.orders} sub="Paid orders placed" to="/customer/orders" delay={80} />
        <StatCard label="In progress" icon="truck" value={stats.inProgress} sub={stats.inProgress > 0 ? "Being prepared or on the way" : "Nothing on the way"} highlight={stats.inProgress > 0} to="/customer/orders" delay={160} />
        <StatCard label="Delivered" icon="check" value={stats.delivered} sub="Orders you have received" delay={240} />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <Card delay={300} className="xl:col-span-2">
          <CardHeader title="Monthly spending" subtitle="Paid orders, last 6 months" />
          <TrendChart data={spendData} variant="bars" formatValue={formatPrice} formatTick={(v) => formatPrice(Math.round(v))} detailLabel="orders" />
        </Card>
        <Card delay={380}>
          <CardHeader title="Your orders" subtitle="By status" />
          {donutTotal === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B6B6B] mb-3">You have not placed an order yet.</p>
              <Link to="/products" className="text-xs font-medium text-[#C9A227] hover:underline">Start shopping</Link>
            </div>
          ) : (
            <DonutChart segments={donut} centerLabel="orders" />
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card delay={420}>
          <CardHeader title="On the way" subtitle="Shipped and heading to you" />
          {onTheWay.length === 0 ? <p className="text-sm text-[#6B6B6B] py-6 text-center">No shipments right now.</p> : <div className="divide-y divide-[#F0F0F0]">{onTheWay.map((o) => <OrderRow key={o.id} o={o} />)}</div>}
        </Card>
        <Card delay={460}>
          <CardHeader title="Recent orders" action={<Link to="/customer/orders" className="text-xs text-[#C9A227] hover:underline">View all</Link>} />
          {recentOrders.length === 0 ? <p className="text-sm text-[#6B6B6B] py-6 text-center">Your orders will appear here.</p> : <div className="divide-y divide-[#F0F0F0]">{recentOrders.map((o) => <OrderRow key={o.id} o={o} />)}</div>}
        </Card>
      </div>

      <Card delay={500}>
        <CardHeader
          title="Pick up where you left off"
          subtitle={stats.cartItems > 0 ? `${stats.cartItems} ${stats.cartItems === 1 ? "item" : "items"} waiting in your cart` : "Products you looked at recently"}
          action={stats.cartItems > 0 ? <button onClick={openCart} className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all">View cart</button> : null}
        />
        {recentlyViewed.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] py-4 text-center">Browse the marketplace and your recent products will show up here.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recentlyViewed.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="w-36 shrink-0 rounded-xl border border-[#EEEBE4] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="aspect-square bg-[#F6F4F0]"><SmartImage src={p.image} alt={p.name} className="w-full h-full object-contain p-2 mix-blend-multiply" /></div>
                <div className="p-2.5">
                  <p className="text-xs text-[#111111] truncate">{p.name}</p>
                  <p className="text-[11px] text-[#6B6B6B]">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}