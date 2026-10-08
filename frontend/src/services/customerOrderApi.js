import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function getMyOrders({ page = 1, limit = 10, status = "all", paymentStatus = "all", search = "", searchBy = "orderId" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status, paymentStatus, searchBy });
  if (search) params.set("search", search);
  const res = await apiFetch(`/orders?${params.toString()}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load orders");
}

export async function getMyOrder(id) {
  const res = await apiFetch(`/orders/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load order");
}