import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useToast } from "../context/ToastContext";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications,
} from "../services/notificationApi";
import { NotificationItem } from "../components/notifications/NotificationItem";
import { Pagination } from "../components/ui/Pagination";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";
import { Spinner } from "../components/ui/Spinner";
import { isInternalLink } from "../utils/notificationUtils";

const LIMIT = 15;
const CATEGORY_LABELS = { orders: "Orders", products: "Products", sellers: "Sellers", reports: "Reports", account: "Account" };
const CATEGORIES_BY_ROLE = {
  customer: ["orders", "reports", "account"],
  seller: ["orders", "products", "reports", "account"],
  admin: ["products", "sellers", "reports", "account"],
};
const selectClass =
  "px-4 py-2 rounded-full border border-[#E5E5E5] bg-white text-xs text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function NotificationsPage() {
  const { user } = useAuth();
  const { unreadCount, adjustUnread, setUnread, refreshUnread } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const requestIdRef = useRef(0);
  const categories = CATEGORIES_BY_ROLE[user?.role] || [];

  const fetchPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getNotifications({ page, limit: LIMIT, status, category });
      if (requestId !== requestIdRef.current) return; // a newer request started, ignore this one

      if (res.data.notifications.length === 0 && page > 1) {
        setPage(res.data.pagination.pages);
        return;
      }
      setItems(res.data.notifications);
      setPagination(res.data.pagination);
      setUnread(res.data.unreadCount);
      setHasLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load notifications.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, status, category, setUnread]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const handleOpen = async (notification) => {
    if (!notification.readAt) {
      setItems((list) => list.map((n) => (n._id === notification._id ? { ...n, readAt: new Date().toISOString() } : n)));
      adjustUnread(-1);
      markNotificationRead(notification._id).catch(() => { fetchPage(); refreshUnread(); });
    }
    if (isInternalLink(notification.link)) navigate(notification.link);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      showToast("All notifications marked as read");
      fetchPage();
    } catch (err) {
      showToast(err.message || "Could not mark notifications as read.", "error");
    }
  };

  const handleDelete = async (notification) => {
    setItems((list) => list.filter((n) => n._id !== notification._id));
    try {
      await deleteNotification(notification._id);
      fetchPage();
    } catch (err) {
      showToast(err.message || "Could not delete the notification.", "error");
      fetchPage();
    }
  };

  const handleClearRead = async () => {
    setClearing(true);
    try {
      const res = await clearReadNotifications();
      showToast(res.data.deleted > 0 ? `Cleared ${res.data.deleted} read notification${res.data.deleted === 1 ? "" : "s"}` : "No read notifications to clear");
      setClearOpen(false);
      fetchPage();
    } catch (err) {
      showToast(err.message || "Could not clear notifications.", "error");
    } finally {
      setClearing(false);
    }
  };

  const filtered = status !== "all" || category !== "all";

  return (
    <div className="animate-fade-slide-up max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Notifications</h1>
          <p className="text-sm text-[#6B6B6B]">Updates about your orders, products and account.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={handleMarkAll} disabled={unreadCount === 0} className="text-xs text-[#C9A227] hover:underline disabled:opacity-40 disabled:no-underline">
            Mark all as read
          </button>
          <button onClick={() => setClearOpen(true)} className="text-xs text-[#6B6B6B] hover:text-red-500 transition-colors">
            Clear read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {[{ value: "all", label: "All" }, { value: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` }].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${status === tab.value ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category" className={selectClass}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      {loading && !hasLoaded && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchPage} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try again</button>
        </div>
      )}

      {hasLoaded && !error && items.length === 0 && (
        <div className="border border-dashed border-[#E5E5E5] rounded-2xl bg-white py-16 text-center">
          <p className="text-sm font-medium text-[#111111] mb-1">{filtered ? "Nothing matches these filters" : "You're all caught up"}</p>
          <p className="text-xs text-[#6B6B6B]">{filtered ? "Try a different filter." : "New notifications will appear here."}</p>
          {filtered && (
            <button onClick={() => { setStatus("all"); setCategory("all"); setPage(1); }} className="text-xs font-medium text-[#C9A227] hover:underline mt-3">
              Clear filters
            </button>
          )}
        </div>
      )}

      {hasLoaded && !error && items.length > 0 && (
        <div className="space-y-4">
          <div className={`border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden divide-y divide-[#F0F0F0] transition-opacity ${loading ? "opacity-60" : ""}`}>
            {items.map((n) => <NotificationItem key={n._id} notification={n} onOpen={handleOpen} onDelete={handleDelete} />)}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} />
        </div>
      )}

      <ConfirmActionModal
        open={clearOpen}
        danger
        title="Clear read notifications?"
        message="Every notification you have already read will be permanently deleted. Unread ones are kept."
        confirmLabel="Clear read"
        loading={clearing}
        onConfirm={handleClearRead}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}