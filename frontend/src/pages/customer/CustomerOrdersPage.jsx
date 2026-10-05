// frontend/src/pages/customer/CustomerOrdersPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge, EmptyState } from "./CustomerDashboard";
import { mockOrders } from "../../data/customerMockData";

const FILTERS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

export function CustomerOrdersPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return mockOrders.filter((o) => {
      const matchesFilter = filter === "All" || o.status === filter.toLowerCase();
      const matchesQuery = o.id.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">My Orders</h1>
      <p className="text-sm text-[#6B6B6B] mb-6">Track and manage everything you've ordered.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order number..." className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors duration-200 ${filter === f ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>{f}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Try a different filter or search term." actionLabel="Browse Products" actionTo="/" />
      ) : (
        <>
          <div className="hidden sm:block border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
                  <th className="py-3 px-5 font-medium">Order</th>
                  <th className="py-3 px-2 font-medium">Date</th>
                  <th className="py-3 px-2 font-medium">Seller</th>
                  <th className="py-3 px-2 font-medium">Items</th>
                  <th className="py-3 px-2 font-medium">Total</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-5 text-[#111111] font-medium">{order.id}</td>
                    <td className="py-3.5 px-2 text-[#6B6B6B]">{order.date}</td>
                    <td className="py-3.5 px-2 text-[#6B6B6B]">{order.seller}</td>
                    <td className="py-3.5 px-2 text-[#6B6B6B]">{order.items}</td>
                    <td className="py-3.5 px-2 text-[#111111]">${order.total.toFixed(2)}</td>
                    <td className="py-3.5 px-2"><StatusBadge status={order.status} /></td>
                    <td className="py-3.5 px-5 text-right"><Link to={`/customer/orders/${order.id}`} className="text-xs text-[#C9A227] hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {filtered.map((order) => (
              <Link key={order.id} to={`/customer/orders/${order.id}`} className="flex items-center gap-3 border border-[#E5E5E5] rounded-2xl p-3.5 bg-white">
                <img src={order.preview} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1"><p className="text-sm font-medium text-[#111111] truncate">{order.id}</p><StatusBadge status={order.status} /></div>
                  <p className="text-xs text-[#6B6B6B]">{order.date} · {order.items} items · {order.seller}</p>
                  <p className="text-sm font-medium text-[#111111] mt-1">${order.total.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}