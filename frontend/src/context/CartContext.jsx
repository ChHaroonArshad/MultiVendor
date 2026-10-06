import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchCart, addCartItem, updateCartItem, removeCartItem, clearCartApi } from "../services/cartApi";
import { transformCart } from "../utils/transformCartItem";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Only customers have a real server-side cart. A logged-out visitor or a
  // seller/admin (who can't buy anyway, per usePurchaseGuard) just sees an
  // empty cart with nothing fetched.
  useEffect(() => {
    if (!user || user.role !== "customer") {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCart()
      .then((res) => { if (!cancelled) setItems(transformCart(res.data.cart)); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const addItem = useCallback(async (product, qty = 1) => {
    try {
      const res = await addCartItem(product.id, qty);
      setItems(transformCart(res.data.cart));
      showToast(`${product.name} added to cart`);
    } catch (err) {
      showToast(err?.message || "Failed to add to cart");
    }
  }, [showToast]);

  const removeItem = useCallback(async (id) => {
    try {
      const res = await removeCartItem(id);
      setItems(transformCart(res.data.cart));
    } catch (err) {
      showToast(err?.message || "Failed to remove item");
    }
  }, [showToast]);

  const updateQty = useCallback(async (id, qty) => {
    if (qty < 1) return;
    try {
      const res = await updateCartItem(id, qty);
      setItems(transformCart(res.data.cart));
    } catch (err) {
      showToast(err?.message || "Failed to update quantity");
    }
  }, [showToast]);

  const clearCart = useCallback(async () => {
    try {
      await clearCartApi();
      setItems([]);
    } catch (err) {
      showToast(err?.message || "Failed to clear cart");
    }
  }, [showToast]);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const value = useMemo(
    () => ({
      items, totalCount, totalPrice, loading,
      addItem, removeItem, updateQty, clearCart,
      drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
      toast,
    }),
    [items, totalCount, totalPrice, loading, addItem, removeItem, updateQty, clearCart, drawerOpen, toast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}