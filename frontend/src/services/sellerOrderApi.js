import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function getSellerOrders({ page = 1, limit = 10, status = "all", search = "", searchBy = "orderId" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status, searchBy });
  if (search) params.set("search", search);
  const res = await apiFetch(`/seller/orders?${params.toString()}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load orders");
}

export async function getSellerOrder(id) {
  const res = await apiFetch(`/seller/orders/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load order");
}

export async function updateOrderStatus(id, status) {
  const res = await apiFetch(`/seller/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return parseOrThrow(res, "Failed to update order status");
}

export async function getOrderStats() {
  const res = await apiFetch("/seller/orders/stats", { method: "GET" });
  return parseOrThrow(res, "Failed to load stats");
}