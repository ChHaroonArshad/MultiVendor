import { useMemo, useState } from "react";
import { adminSellers } from "../../data/adminDashboardData";
import { AdminStatusBadge } from "../../pages/admin/AdminStatusBadge";


const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "suspended"];

export function AdminSellersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return adminSellers.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Sellers</h1>
        <p className="text-sm text-[#6B6B6B]">Review seller applications and manage store accounts.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sellers..."
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
                <th className="py-3 px-5 font-medium">Store</th>
                <th className="py-3 px-5 font-medium">Email</th>
                <th className="py-3 px-5 font-medium">Category</th>
                <th className="py-3 px-5 font-medium">Products</th>
                <th className="py-3 px-5 font-medium">Applied</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="py-3.5 px-5 text-[#111111] font-medium whitespace-nowrap">{s.name}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{s.email}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{s.category}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B]">{s.products}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{s.appliedOn}</td>
                  <td className="py-3.5 px-5"><AdminStatusBadge status={s.status} /></td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    {s.status === "pending" ? (
                      <div className="flex gap-1.5 justify-end">
                        <button className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all">Approve</button>
                        <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors">Reject</button>
                      </div>
                    ) : s.status === "approved" ? (
                      <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors">Suspend</button>
                    ) : s.status === "suspended" ? (
                      <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#2E7D32] hover:border-[#2E7D32]/50 transition-colors">Reactivate</button>
                    ) : (
                      <span className="text-xs text-[#B0B0B0]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-[#B0B0B0]">No sellers match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}