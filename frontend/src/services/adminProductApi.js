import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) {
    const err = new Error(json.message || fallbackMessage);
    err.errors = json.errors;
    throw err;
  }
  return json;
}

export async function getAllProducts(status) {
  const query = status && status !== "all" ? `?status=${status}` : "";
  const res = await apiFetch(`/admin/products${query}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load products");
}

export async function getProduct(id) {
  const res = await apiFetch(`/admin/products/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load product");
}

export async function approveProduct(id) {
  const res = await apiFetch(`/admin/products/${id}/approve`, { method: "PATCH" });
  return parseOrThrow(res, "Failed to approve product");
}

export async function rejectProduct(id, reason) {
  const res = await apiFetch(`/admin/products/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return parseOrThrow(res, "Failed to reject product");
}