import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import { getSellerOrders, updateOrderStatus, getOrderStats } from "../../services/sellerOrderApi";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { OrderActionsMenu } from "../../components/seller/OrderActionsMenu";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmActionModal } from "../../components/ui/ConfirmActionModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";
import { shortOrderId } from "../../utils/orderUtils";

const LIMIT = 10;

const SEARCH_OPTIONS = [
  { value: "orderId", label: "Order ID" },
  { value: "product", label: "Product name" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All orders" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "not-delivered", label: "Not delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const selectClass =
  "px-4 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function SellerOrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchBy, setSearchBy] = useState("orderId");
  const [searchInput, setSearchInput] = useState(""); // what the seller is typing right now
  const [search, setSearch] = useState(""); // the debounced value that actually hits the API

  const [updatingId, setUpdatingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const requestIdRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getSellerOrders({ page, limit: LIMIT, status: statusFilter, search, searchBy });
      if (requestId !== requestIdRef.current) return; // a newer request has started, ignore this one

      // landed on a page that no longer exists (e.g. last row was just moved out of this filter)
      if (res.data.orders.length === 0 && page > 1) {
        setPage(res.data.pagination.pages);
        return;
      }

      setOrders(res.data.orders);
      setPagination(res.data.pagination);
      setHasLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load orders.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, statusFilter, search, searchBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getOrderStats();
      setStats(res.data.stats);
    } catch {
      // stats are secondary, the orders list still works without them
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // lodash debounce: the API is only called 400ms after the seller stops typing
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

  const handleSearchByChange = (e) => {
    setSearchBy(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const runStatusUpdate = async (order, nextStatus, successMessage) => {
    setUpdatingId(order._id);
    try {
      await updateOrderStatus(order._id, nextStatus);
      showToast(successMessage);
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (err) {
      showToast(err.message || "Failed to update order.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    const target = cancelTarget;
    if (!target) return;
    await runStatusUpdate(target, "cancelled", "Order cancelled and refunded to the customer");
    setCancelTarget(null);
  };

  const hasFilters = statusFilter !== "all" || search !== "";
  const statCards = stats
    ? [
        { label: "Total orders", value: stats.total },
        { label: "Processing", value: stats.processing },
        { label: "Shipped", value: stats.shipped },
        { label: "Delivered", value: stats.delivered },
        { label: "Revenue", value: `$${stats.revenue.toFixed(2)}` },
      ]
    : [];

  return (
    <div className="animate-fade-slide-up space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Orders</h1>
        <p className="text-sm text-[#6B6B6B]">Manage and fulfill your customer orders.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="border border-[#E5E5E5] rounded-2xl p-4 bg-white">
              <p className="text-xs text-[#6B6B6B] mb-1">{s.label}</p>
              <p className="text-xl font-serif text-[#111111]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex flex-1 min-w-0">
          <select value={searchBy} onChange={handleSearchByChange} aria-label="Search by" className={`${selectClass} rounded-l-full border-r-0 pr-3`}>
            {SEARCH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="relative flex-1 min-w-0">
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder={searchBy === "orderId" ? "Search by order ID, e.g. FF5147" : "Search by product name"}
              className="w-full pl-4 pr-9 py-2.5 rounded-r-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
            />
            {searchInput && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>
            )}
          </div>
        </div>
        <select value={statusFilter} onChange={handleStatusChange} aria-label="Filter by status" className={`${selectClass} rounded-full lg:w-52`}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && !hasLoaded && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading orders...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchOrders} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {hasLoaded && !error && orders.length === 0 && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 text-center">
          <p className="text-sm text-[#6B6B6B] mb-1">
            {hasFilters ? "No orders match your search or filters." : "You don't have any orders yet."}
          </p>
          {hasFilters && (
            <button
              onClick={() => { clearSearch(); setStatusFilter("all"); }}
              className="text-xs font-medium text-[#C9A227] hover:underline mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {hasLoaded && !error && orders.length > 0 && (
        <div className="space-y-4">
          <div className={`border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
                    <th className="py-3 px-5 font-medium">Order ID</th>
                    <th className="py-3 px-3 font-medium">Customer</th>
                    <th className="py-3 px-3 font-medium">Products</th>
                    <th className="py-3 px-3 font-medium">Date</th>
                    <th className="py-3 px-3 font-medium">Payment</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Amount</th>
                    <th className="py-3 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/seller/orders/${o._id}`)} className="font-medium text-[#111111] hover:text-[#C9A227] transition-colors">
                            #{shortOrderId(o._id)}
                          </button>
                          <CopyButton text={o._id} toastMessage="Order ID copied" label="Copy order ID" />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-[170px]">
                          <Avatar name={o.buyer?.name} src={o.buyer?.avatar} size={32} />
                          <div className="min-w-0">
                            <p className="text-sm text-[#111111] truncate max-w-[160px]">{o.buyer?.name || "Deleted user"}</p>
                            <p className="text-[11px] text-[#B0B0B0] truncate max-w-[160px]">{o.buyer?.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6B6B6B]">
                        <p className="truncate max-w-[180px]">{o.items[0]?.name}</p>
                        {o.items.length > 1 && <p className="text-[11px] text-[#B0B0B0]">+{o.items.length - 1} more</p>}
                      </td>
                      <td className="py-3 px-3 text-[#6B6B6B] whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><OrderStatusBadge status={o.paymentStatus} /></td>
                      <td className="py-3 px-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-3 px-3 text-right text-[#111111] font-medium whitespace-nowrap">${o.subtotal.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right">
                        <OrderActionsMenu
                          order={o}
                          busy={updatingId === o._id}
                          onView={() => navigate(`/seller/orders/${o._id}`)}
                          onShip={() => runStatusUpdate(o, "shipped", "Order marked as shipped")}
                          onDeliver={() => runStatusUpdate(o, "delivered", "Order marked as delivered")}
                          onCancel={() => setCancelTarget(o)}
                        />
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

      <ConfirmActionModal
        open={!!cancelTarget}
        danger
        title={`Cancel order #${cancelTarget ? shortOrderId(cancelTarget._id) : ""}?`}
        message={`This refunds $${cancelTarget ? cancelTarget.subtotal.toFixed(2) : "0.00"} to the customer and puts the items back in stock. This can't be undone.`}
        confirmLabel="Cancel & refund"
        loading={!!cancelTarget && updatingId === cancelTarget._id}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}