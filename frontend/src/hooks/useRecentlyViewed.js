import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getViewerId, getRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";

export function useRecentlyViewed(limit = 6) {
  const { user, loading } = useAuth();
  const userId = getViewerId(user);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (loading) return; // don't read the GUEST list while the session is still being checked
    setItems(getRecentlyViewed(userId).slice(0, limit));
  }, [userId, loading, limit]);

  const clear = useCallback(() => {
    clearRecentlyViewed(userId);
    setItems([]);
  }, [userId]);

  return { items, clear };
}