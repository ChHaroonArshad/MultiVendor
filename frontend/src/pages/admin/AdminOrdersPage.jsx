import { useMemo, useState } from "react";
import { adminOrdersList } from "../../data/adminDashboardData";
import { AdminStatusBadge } from "../../pages/admin/AdminStatusBadge";


const STATUS_FILTERS = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];

export function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return adminOrdersList.filter((o) => {
      const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.seller.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Orders</h1>
        <p className="text-sm text-[#6B6B6B]">All orders placed across every seller on the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, customer, or seller..."
          className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${statusFilter === s ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                <th className="py-3 px-5 font-medium">Order</th>
                <th className="py-3 px-5 font-medium">Customer</th>
                <th className="py-3 px-5 font-medium">Seller</th>
                <th className="py-3 px-5 font-medium">Items</th>
                <th className="py-3 px-5 font-medium">Date</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="py-3.5 px-5 text-[#111111] font-medium whitespace-nowrap">{o.id}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{o.customer}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{o.seller}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B]">{o.items}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{o.date}</td>
                  <td className="py-3.5 px-5"><AdminStatusBadge status={o.status} /></td>
                  <td className="py-3.5 px-5 text-right text-[#111111] font-medium whitespace-nowrap">${o.amount}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-[#B0B0B0]">No orders match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}