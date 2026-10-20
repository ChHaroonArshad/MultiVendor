import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./ToastContext";
import { getWishlistIds, addToWishlist, removeFromWishlist } from "../services/wishlistApi";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?._id || user?.id;
  const isCustomer = user?.role === "customer";

  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(new Set()); // product ids with a request in flight: ignores double clicks
  const idSet = useMemo(() => new Set(ids), [ids]);
  const idSetRef = useRef(idSet);
  idSetRef.current = idSet;

  const refresh = useCallback(async () => {
    try {
      const res = await getWishlistIds();
      setIds(res.data.ids);
    } catch {
      // keep what we have; the next change will retry
    }
  }, []);

  useEffect(() => {
    if (!userId || !isCustomer) {
      setIds([]); // logged out, or a seller/admin: nothing to show
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    getWishlistIds()
      .then((res) => { if (!cancelled) setIds(res.data.ids); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, isCustomer]);

  const setMembership = useCallback(
    async (product, shouldAdd) => {
      if (!isCustomer || !product?.id) return;
      const id = String(product.id);
      if (pendingRef.current.has(id)) return;
      pendingRef.current.add(id);

      // Optimistic: the heart changes immediately, and is rolled back if the server refuses.
      setIds((list) => (shouldAdd ? (list.includes(id) ? list : [id, ...list]) : list.filter((x) => x !== id)));
      try {
        if (shouldAdd) await addToWishlist(id);
        else await removeFromWishlist(id);
        showToast(shouldAdd ? "Added to your wishlist" : "Removed from your wishlist");
      } catch (err) {
        setIds((list) => (shouldAdd ? list.filter((x) => x !== id) : list.includes(id) ? list : [id, ...list]));
        showToast(err.message || "Could not update your wishlist.", "error");
      } finally {
        pendingRef.current.delete(id);
      }
    },
    [isCustomer, showToast]
  );

  const toggle = useCallback((product) => setMembership(product, !idSetRef.current.has(String(product.id))), [setMembership]);
  const remove = useCallback((product) => setMembership(product, false), [setMembership]);
  const has = useCallback((id) => idSet.has(String(id)), [idSet]);

  const value = useMemo(
    () => ({ count: ids.length, loading, has, toggle, remove, refresh }),
    [ids.length, loading, has, toggle, remove, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}