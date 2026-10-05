import { useMemo, useState } from "react";
import { StatusBadge } from "../../pages/seller/StatusBadge";
import { sellerOrders, orderStats } from "../../data/sellerDashboardData";

const FILTERS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export function SellerOrdersPage() {
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(() => sellerOrders.filter((o) => filter === "All" || o.status === filter.toLowerCase()), [filter]);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Orders</h1>
      <p className="text-sm text-[#6B6B6B] mb-6">Track and fulfill customer orders for your store.</p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[["Total", orderStats.total], ["Pending", orderStats.pending], ["Processing", orderStats.processing], ["Shipped", orderStats.shipped], ["Delivered", orderStats.delivered]].map(([label, val]) => (
          <div key={label} className="border border-[#E5E5E5] rounded-2xl p-4 bg-white text-center">
            <p className="text-lg font-serif text-[#111111]">{val}</p>
            <p className="text-[11px] text-[#6B6B6B]">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors duration-200 ${filter === f ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>{f}</button>
        ))}
      </div>

      <div className="hidden sm:block border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
              <th className="py-3 px-5 font-medium">Order</th>
              <th className="py-3 px-2 font-medium">Customer</th>
              <th className="py-3 px-2 font-medium">Product</th>
              <th className="py-3 px-2 font-medium">Date</th>
              <th className="py-3 px-2 font-medium">Amount</th>
              <th className="py-3 px-2 font-medium">Payment</th>
              <th className="py-3 px-2 font-medium">Status</th>
              <th className="py-3 px-5 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                <td className="py-3 px-5 text-[#111111] font-medium">{o.id}</td>
                <td className="py-3 px-2 text-[#6B6B6B]">{o.customer}</td>
                <td className="py-3 px-2 text-[#6B6B6B]">{o.product}</td>
                <td className="py-3 px-2 text-[#6B6B6B]">{o.date}</td>
                <td className="py-3 px-2 text-[#111111]">${o.amount}</td>
                <td className="py-3 px-2 text-[#6B6B6B]">{o.payment}</td>
                <td className="py-3 px-2"><StatusBadge status={o.status} /></td>
                <td className="py-3 px-5 text-right"><button className="text-xs text-[#C9A227] hover:underline cursor-pointer">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="border border-[#E5E5E5] rounded-2xl p-4 bg-white text-xs">
            <div className="flex justify-between mb-1"><span className="font-medium text-[#111111]">{o.id}</span><StatusBadge status={o.status} /></div>
            <p className="text-[#6B6B6B]">{o.customer} · {o.product}</p>
            <p className="text-[#6B6B6B] mt-0.5">{o.date}</p>
            <p className="text-[#111111] font-medium mt-1">${o.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}