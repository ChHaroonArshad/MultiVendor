import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function getPublicProducts(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
  ).toString();
  const res = await apiFetch(`/products${query ? `?${query}` : ""}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load products");
}

export async function getPublicProduct(id) {
  const res = await apiFetch(`/products/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load product");
}