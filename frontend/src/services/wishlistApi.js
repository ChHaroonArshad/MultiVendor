import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.errors?.[0]?.message || json.message || fallbackMessage);
  return json;
}

export async function getWishlistIds() {
  return parseOrThrow(await apiFetch("/wishlist/ids"), "Failed to load wishlist");
}

export async function getWishlist({ page = 1, limit = 12, search = "", sort = "recent" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (search) params.set("search", search);
  return parseOrThrow(await apiFetch(`/wishlist?${params.toString()}`), "Failed to load wishlist");
}

export async function addToWishlist(productId) {
  const res = await apiFetch("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
  return parseOrThrow(res, "Failed to add to wishlist");
}

export async function removeFromWishlist(productId) {
  return parseOrThrow(await apiFetch(`/wishlist/${productId}`, { method: "DELETE" }), "Failed to remove from wishlist");
}

export async function clearWishlist() {
  return parseOrThrow(await apiFetch("/wishlist", { method: "DELETE" }), "Failed to clear wishlist");
}