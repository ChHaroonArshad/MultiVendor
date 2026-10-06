import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) {
    const err = new Error(json.message || fallbackMessage);
    throw err;
  }
  return json;
}

export async function fetchCart() {
  const res = await apiFetch("/cart", { method: "GET" });
  return parseOrThrow(res, "Failed to load cart");
}

export async function addCartItem(productId, quantity = 1) {
  const res = await apiFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  return parseOrThrow(res, "Failed to add item to cart");
}

export async function updateCartItem(productId, quantity) {
  const res = await apiFetch(`/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return parseOrThrow(res, "Failed to update cart item");
}

export async function removeCartItem(productId) {
  const res = await apiFetch(`/cart/items/${productId}`, { method: "DELETE" });
  return parseOrThrow(res, "Failed to remove cart item");
}

export async function clearCartApi() {
  const res = await apiFetch("/cart", { method: "DELETE" });
  return parseOrThrow(res, "Failed to clear cart");
}