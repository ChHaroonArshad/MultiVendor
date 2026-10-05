import { useMemo, useState } from "react";
import { adminUsers } from "../../data/adminDashboardData";
import { AdminStatusBadge } from "../../pages/admin/AdminStatusBadge";

const ROLE_FILTERS = ["all", "customer", "seller", "admin"];

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    return adminUsers.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Users</h1>
        <p className="text-sm text-[#6B6B6B]">All customers, sellers, and admins on the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${roleFilter === r ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                <th className="py-3 px-5 font-medium">Name</th>
                <th className="py-3 px-5 font-medium">Email</th>
                <th className="py-3 px-5 font-medium">Role</th>
                <th className="py-3 px-5 font-medium">Joined</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="py-3.5 px-5 text-[#111111] font-medium whitespace-nowrap">{u.name}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{u.email}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] capitalize whitespace-nowrap">{u.role}</td>
                  <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{u.joined}</td>
                  <td className="py-3.5 px-5"><AdminStatusBadge status={u.status} /></td>
                  <td className="py-3.5 px-5 text-right">
                    {u.role !== "admin" && (
                      <button className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${u.status === "active" ? "border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50" : "border-[#E5E5E5] text-[#2E7D32] hover:border-[#2E7D32]/50"}`}>
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-[#B0B0B0]">No users match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}