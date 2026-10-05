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

export async function createProduct(formData) {
  const res = await apiFetch("/seller/products", { method: "POST", body: formData });
  return parseOrThrow(res, "Failed to create product");
}

export async function getMyProducts() {
  const res = await apiFetch("/seller/products", { method: "GET" });
  return parseOrThrow(res, "Failed to load products");
}

export async function getProduct(id) {
  const res = await apiFetch(`/seller/products/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load product");
}

export async function updateProduct(id, formData) {
  const res = await apiFetch(`/seller/products/${id}`, { method: "PATCH", body: formData });
  return parseOrThrow(res, "Failed to update product");
}

export async function deleteProduct(id) {
  const res = await apiFetch(`/seller/products/${id}`, { method: "DELETE" });
  return parseOrThrow(res, "Failed to delete product");
}

export async function togglePublishProduct(id, isPublished) {
  const res = await apiFetch(`/seller/products/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ isPublished }),
  });
  return parseOrThrow(res, "Failed to update publish status");
}