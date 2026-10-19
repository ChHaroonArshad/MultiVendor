import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/notificationApi";
import { getNotificationsPath, isInternalLink } from "../../utils/notificationUtils";
import { NotificationItem } from "./NotificationItem";
import { Spinner } from "../ui/Spinner";

const PREVIEW_LIMIT = 8;

export function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount, adjustUnread, setUnread, refreshUnread } = useNotifications();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const menuRef = useClickOutside(open, close);

  // Load the latest items each time the dropdown opens
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    getNotifications({ limit: PREVIEW_LIMIT })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.notifications);
        setUnread(res.data.unreadCount);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, setUnread]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleOpenItem = async (notification) => {
    if (!notification.readAt) {
      setItems((list) => list.map((n) => (n._id === notification._id ? { ...n, readAt: new Date().toISOString() } : n)));
      adjustUnread(-1); // instant; the server value replaces it on the next sync
      markNotificationRead(notification._id).catch(refreshUnread);
    }
    setOpen(false);
    if (isInternalLink(notification.link)) navigate(notification.link);
  };

  const handleMarkAll = async () => {
    setItems((list) => list.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refreshUnread();
    }
  };

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] bg-white border border-[#E5E5E5] rounded-2xl shadow-lg overflow-hidden animate-fade-slide-up z-40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
            <p className="text-sm font-medium text-[#111111]">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAll} className="text-xs text-[#C9A227] hover:underline">Mark all as read</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#F0F0F0]">
            {loading && (
              <div className="py-10 flex items-center justify-center gap-2">
                <Spinner size={14} className="text-[#6B6B6B]" />
                <p className="text-xs text-[#6B6B6B]">Loading...</p>
              </div>
            )}
            {!loading && items.length === 0 && (
              <p className="py-10 text-center text-xs text-[#6B6B6B]">You're all caught up.</p>
            )}
            {!loading && items.map((n) => <NotificationItem key={n._id} notification={n} onOpen={handleOpenItem} />)}
          </div>

          <Link
            to={getNotificationsPath(user?.role)}
            onClick={close}
            className="block text-center text-xs font-medium text-[#111111] py-3 border-t border-[#E5E5E5] hover:bg-[#FAFAFA] transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}