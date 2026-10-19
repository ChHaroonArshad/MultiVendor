import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUnreadCount } from "../services/notificationApi";

export const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 45000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id; // depend on the id, so a profile refresh does not restart polling
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch {
      // keep the last known number; the next poll will retry
    }
  }, []);

  const adjustUnread = useCallback((delta) => setUnreadCount((count) => Math.max(0, count + delta)), []);
  const setUnread = useCallback((value) => setUnreadCount(Math.max(0, Number(value) || 0)), []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return undefined;
    }

    refreshUnread();

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refreshUnread();
    };
    const timer = setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [userId, refreshUnread]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnread, adjustUnread, setUnread }),
    [unreadCount, refreshUnread, adjustUnread, setUnread]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}