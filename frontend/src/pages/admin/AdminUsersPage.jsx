import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import { getUsers, getUserStats, suspendUser, reactivateUser } from "../../services/adminUserApi";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { RoleBadge } from "../../components/admin/RoleBadge";
import { Avatar } from "../../components/ui/Avatar";
import { Pagination } from "../../components/ui/Pagination";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { ReasonModal } from "../../components/ui/ReasonModal";
import { ConfirmActionModal } from "../../components/ui/ConfirmActionModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";

const LIMIT = 10;

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customers" },
  { value: "seller", label: "Sellers" },
  { value: "admin", label: "Admins" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const selectClass =
  "px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [actingId, setActingId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);

  const requestIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getUsers({ page, limit: LIMIT, role: roleFilter, status: statusFilter, search });
      if (requestId !== requestIdRef.current) return;

      if (res.data.users.length === 0 && page > 1) {
        setPage(res.data.pagination.pages);
        return;
      }

      setUsers(res.data.users);
      setPagination(res.data.pagination);
      setHasLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load users.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getUserStats();
      setStats(res.data.stats);
    } catch {
      // stats are secondary, the list still works without them
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const applySearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 400),
    []
  );
  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    applySearch(e.target.value);
  };

  const clearSearch = () => {
    applySearch.cancel();
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleSuspend = async (reason) => {
    const target = suspendTarget;
    if (!target) return;
    setActingId(target._id);
    try {
      await suspendUser(target._id, reason);
      showToast(`${target.name} suspended and notified by email`);
      setSuspendTarget(null);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      showToast(err.message || "Failed to suspend user.", "error");
    } finally {
      setActingId(null);
    }
  };

  const handleReactivate = async () => {
    const target = reactivateTarget;
    if (!target) return;
    setActingId(target._id);
    try {
      await reactivateUser(target._id);
      showToast(`${target.name} reactivated and notified by email`);
      setReactivateTarget(null);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      showToast(err.message || "Failed to reactivate user.", "error");
    } finally {
      setActingId(null);
    }
  };

  const buildMenuItems = (u) => {
    const items = [{ key: "view", label: "View details", onClick: () => navigate(`/admin/users/${u._id}`) }];
    if (u.role !== "admin") {
      items.push(
        u.status === "active"
          ? { key: "suspend", label: "Suspend account", danger: true, onClick: () => setSuspendTarget(u) }
          : { key: "reactivate", label: "Reactivate account", onClick: () => setReactivateTarget(u) }
      );
    }
    return items;
  };

  const hasFilters = roleFilter !== "all" || statusFilter !== "all" || search !== "";
  const statCards = stats
    ? [
        { label: "Total users", value: stats.total },
        { label: "Customers", value: stats.customers },
        { label: "Sellers", value: stats.sellers },
        { label: "Suspended", value: stats.suspended },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Users</h1>
        <p className="text-sm text-[#6B6B6B]">All customers, sellers, and admins on the platform.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-2xl p-4">
              <p className="text-xs text-[#6B6B6B] mb-1">{s.label}</p>
              <p className="text-xl font-serif text-[#111111]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full pl-4 pr-9 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
          />
          {searchInput && (
            <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>
          )}
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} aria-label="Filter by role" className={`${selectClass} lg:w-44`}>
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status" className={`${selectClass} lg:w-44`}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && !hasLoaded && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading users...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchUsers} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {hasLoaded && !error && users.length === 0 && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl py-16 text-center">
          <p className="text-sm text-[#6B6B6B] mb-1">
            {hasFilters ? "No users match your search or filters." : "No users yet."}
          </p>
          {hasFilters && (
            <button
              onClick={() => { clearSearch(); setRoleFilter("all"); setStatusFilter("all"); }}
              className="text-xs font-medium text-[#C9A227] hover:underline mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {hasLoaded && !error && users.length > 0 && (
        <div className="space-y-4">
          <div className={`bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                    <th className="py-3 px-5 font-medium">User</th>
                    <th className="py-3 px-5 font-medium">Role</th>
                    <th className="py-3 px-5 font-medium">Joined</th>
                    <th className="py-3 px-5 font-medium">Email</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3.5 px-5">
                        <button onClick={() => navigate(`/admin/users/${u._id}`)} className="flex items-center gap-3 text-left min-w-[200px]">
                          <Avatar name={u.name} size={34} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#111111] truncate max-w-[200px] hover:text-[#C9A227] transition-colors">{u.name}</p>
                            <p className="text-[11px] text-[#B0B0B0] truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="py-3.5 px-5"><RoleBadge role={u.role} /></td>
                      <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {u.isEmailVerified
                          ? <span className="text-xs text-[#2E7D32]">Verified</span>
                          : <span className="text-xs text-[#B98900]">Unverified</span>}
                      </td>
                      <td className="py-3.5 px-5"><AdminStatusBadge status={u.status} /></td>
                      <td className="py-3.5 px-5 text-right">
                        <RowActionsMenu items={buildMenuItems(u)} busy={actingId === u._id} label="User actions" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} />
        </div>
      )}

      <ReasonModal
        open={!!suspendTarget}
        title={`Suspend ${suspendTarget?.name || "this user"}?`}
        description="They will be signed out everywhere and emailed this reason. They won't be able to sign in until you reactivate them."
        placeholder="e.g. Repeated policy violations, fraudulent activity..."
        confirmLabel="Suspend & notify"
        submitting={!!suspendTarget && actingId === suspendTarget._id}
        onSubmit={handleSuspend}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmActionModal
        open={!!reactivateTarget}
        title={`Reactivate ${reactivateTarget?.name || "this user"}?`}
        message="They will be able to sign in again and will be notified by email."
        confirmLabel="Reactivate"
        loading={!!reactivateTarget && actingId === reactivateTarget._id}
        onConfirm={handleReactivate}
        onCancel={() => setReactivateTarget(null)}
      />
    </div>
  );
}