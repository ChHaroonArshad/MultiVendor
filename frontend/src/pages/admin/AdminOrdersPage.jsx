import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import { getAdminOrders, getAdminOrderStats } from "../../services/adminOrderApi";
import { OrderStatusBadge } from "../../components/seller/OrderStatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { shortOrderId, formatMoney } from "../../utils/orderUtils";

const LIMIT = 10;

const SEARCH_OPTIONS = [
  { value: "orderId", label: "Order ID" },
  { value: "product", label: "Product" },
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
];

const PLACEHOLDERS = {
  orderId: "Search by order ID, e.g. FF5147",
  product: "Search by product name",
  customer: "Search by customer name",
  seller: "Search by seller name",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Awaiting payment" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "not-delivered", label: "Not delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Any payment" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "refunded", label: "Refunded" },
];

const selectClass =
  "px-4 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function AdminOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchBy, setSearchBy] = useState("orderId");
  const [searchInput, setSearchInput] = useState(""); // what the admin is typing right now
  const [search, setSearch] = useState(""); // debounced value that actually hits the API

  const requestIdRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getAdminOrders({ page, limit: LIMIT, status: statusFilter, paymentStatus: paymentFilter, search, searchBy });
      if (requestId !== requestIdRef.current) return; // a newer request started, ignore this one

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
  }, [page, statusFilter, paymentFilter, search, searchBy]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    let cancelled = false;
    getAdminOrderStats()
      .then((res) => { if (!cancelled) setStats(res.data.stats); })
      .catch(() => {}); // stats are secondary, the table still works without them
    return () => { cancelled = true; };
  }, []);

  const applySearch = useMemo(
    () => debounce((value) => { setSearch(value); setPage(1); }, 400),
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

  const hasFilters = statusFilter !== "all" || paymentFilter !== "all" || search !== "";

  const statCards = stats
    ? [
        { label: "Total orders", value: stats.total },
        { label: "Revenue", value: formatMoney(stats.revenue) },
        { label: "Refunded", value: formatMoney(stats.refunded) },
        { label: "Awaiting payment", value: stats.awaitingPayment },
        { label: "Processing", value: stats.processing },
        { label: "Shipped", value: stats.shipped },
        { label: "Delivered", value: stats.delivered },
        { label: "Cancelled", value: stats.cancelled },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Orders</h1>
        <p className="text-sm text-[#6B6B6B]">All orders placed across every seller on the platform.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <select value={searchBy} onChange={(e) => { setSearchBy(e.target.value); setPage(1); }} aria-label="Search by" className={`${selectClass} rounded-l-full border-r-0 pr-3`}>
            {SEARCH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="relative flex-1 min-w-0">
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder={PLACEHOLDERS[searchBy]}
              className="w-full pl-4 pr-9 py-2.5 rounded-r-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
            />
            {searchInput && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>
            )}
          </div>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status" className={`${selectClass} rounded-full lg:w-48`}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} aria-label="Filter by payment" className={`${selectClass} rounded-full lg:w-44`}>
          {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            {hasFilters ? "No orders match your search or filters." : "No orders have been placed yet."}
          </p>
          {hasFilters && (
            <button
              onClick={() => { clearSearch(); setStatusFilter("all"); setPaymentFilter("all"); }}
              className="text-xs font-medium text-[#C9A227] hover:underline mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {hasLoaded && !error && orders.length > 0 && (
        <div className="space-y-4">
          <div className={`bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                    <th className="py-3 px-5 font-medium">Order ID</th>
                    <th className="py-3 px-3 font-medium">Customer</th>
                    <th className="py-3 px-3 font-medium">Seller</th>
                    <th className="py-3 px-3 font-medium">Products</th>
                    <th className="py-3 px-3 font-medium">Date</th>
                    <th className="py-3 px-3 font-medium">Payment</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Amount</th>
                    <th className="py-3 px-5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/admin/orders/${o._id}`)} className="font-medium text-[#111111] hover:text-[#C9A227] transition-colors">
                            #{shortOrderId(o._id)}
                          </button>
                          <CopyButton text={o._id} toastMessage="Order ID copied" label="Copy order ID" />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-[170px]">
                          <Avatar name={o.buyer?.name} src={o.buyer?.avatar} size={32} />
                          <div className="min-w-0">
                            <p className="text-sm text-[#111111] truncate max-w-[150px]">{o.buyer?.name || "Deleted user"}</p>
                            <p className="text-[11px] text-[#B0B0B0] truncate max-w-[150px]">{o.buyer?.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          <Avatar name={o.seller?.name} src={o.seller?.avatar} size={28} />
                          <p className="text-sm text-[#111111] truncate max-w-[130px]">{o.seller?.name || "Deleted user"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6B6B6B]">
                        <p className="truncate max-w-[170px]">{o.items[0]?.name}</p>
                        {o.items.length > 1 && <p className="text-[11px] text-[#B0B0B0]">+{o.items.length - 1} more</p>}
                      </td>
                      <td className="py-3 px-3 text-[#6B6B6B] whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><OrderStatusBadge status={o.paymentStatus} /></td>
                      <td className="py-3 px-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-3 px-3 text-right text-[#111111] font-medium whitespace-nowrap">{formatMoney(o.subtotal)}</td>
                      <td className="py-3 px-5 text-right">
                        <button onClick={() => navigate(`/admin/orders/${o._id}`)} className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#E5E5E5] text-[#111111] hover:border-[#C9A227]/50 transition-colors">
                          View
                        </button>
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
    </div>
  );
}