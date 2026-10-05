import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { StatusBadge } from "../../pages/seller/StatusBadge";

import { sellerStats, salesChartData, topProducts, recentOrders, lowStockAlerts, storePerformance } from "../../data/sellerDashboardData";

const PERIODS = [{ key: "7d", label: "7 Days" }, { key: "30d", label: "30 Days" }, { key: "3m", label: "3 Months" }, { key: "1y", label: "1 Year" }];

function SalesChart() {
  const [period, setPeriod] = useState("30d");
  const data = salesChartData[period];
  const max = Math.max(...data);

  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-medium text-[#111111]">Sales Overview</p>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Revenue &amp; Orders</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${period === p.key ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((v, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-[#FBF6E9] to-[#C9A227]/40 rounded-t-md transition-all duration-300 hover:from-[#C9A227]/30 hover:to-[#C9A227]/60" style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SellerOverviewPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Welcome back, {user?.name?.split(" ")[0] || "Seller"}!</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Here's your store overview for today.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {sellerStats.map((stat) => (
          <div key={stat.label} className="border border-[#E5E5E5] rounded-2xl p-5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B] mb-2">{stat.label}</p>
            <p className="text-2xl font-serif text-[#111111]">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.positive ? "text-emerald-600" : "text-red-500"}`}>{stat.change} <span className="text-[#6B6B6B]">{stat.period}</span></p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart />

          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-0">
              <p className="text-sm font-medium text-[#111111]">Recent Orders</p>
              <Link to="/seller/orders" className="text-xs text-[#C9A227] hover:underline">View All</Link>
            </div>
            <div className="hidden sm:block overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
                    <th className="py-2.5 px-5 font-medium">Order</th>
                    <th className="py-2.5 px-2 font-medium">Customer</th>
                    <th className="py-2.5 px-2 font-medium">Product</th>
                    <th className="py-2.5 px-2 font-medium">Amount</th>
                    <th className="py-2.5 px-2 font-medium">Status</th>
                    <th className="py-2.5 px-5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-5 text-[#111111] font-medium">{o.id}</td>
                      <td className="py-3 px-2 text-[#6B6B6B]">{o.customer}</td>
                      <td className="py-3 px-2 text-[#6B6B6B]">{o.product}</td>
                      <td className="py-3 px-2 text-[#111111]">${o.amount}</td>
                      <td className="py-3 px-2"><StatusBadge status={o.status} /></td>
                      <td className="py-3 px-5 text-right"><Link to="/seller/orders" className="text-xs text-[#C9A227] hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden p-5 pt-4 space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="border border-[#E5E5E5] rounded-xl p-3 text-xs">
                  <div className="flex justify-between mb-1"><span className="font-medium text-[#111111]">{o.id}</span><StatusBadge status={o.status} /></div>
                  <p className="text-[#6B6B6B]">{o.customer} · {o.product}</p>
                  <p className="text-[#111111] font-medium mt-1">${o.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <p className="text-sm font-medium text-[#111111]">Top Products</p>
              <Link to="/seller/products" className="text-xs text-[#C9A227] hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-[#E5E5E5]">
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <img src={p.image} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111111] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#6B6B6B]">{p.sold} sold · ${p.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-sm font-medium text-[#111111] mb-3">Low Stock</p>
            <div className="space-y-3">
              {lowStockAlerts.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <img src={a.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111111] truncate">{a.name}</p>
                    <p className="text-[11px] text-red-500">Only {a.left} left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
            <p className="text-sm font-medium text-[#111111] mb-4">Store Performance</p>
            <div className="grid grid-cols-2 gap-4">
              {storePerformance.map((m) => (
                <div key={m.label}>
                  <p className="text-lg font-serif text-[#111111]">{m.value}</p>
                  <p className="text-[11px] text-[#6B6B6B]">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}