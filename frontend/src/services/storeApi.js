import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.errors?.[0]?.message || json.message || fallbackMessage);
    err.fieldErrors = json.errors || [];
    throw err;
  }
  return json;
}

// ----- the seller's own store -----
export async function getMyStore() {
  return parseOrThrow(await apiFetch("/seller/store"), "Failed to load your store");
}

export async function updateMyStore(body) {
  const res = await apiFetch("/seller/store", { method: "PATCH", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to update your store");
}

export async function uploadStoreImage(kind, file) {
  const body = new FormData();
  body.append("image", file);
  const res = await apiFetch(`/seller/store/image/${kind}`, { method: "POST", body });
  return parseOrThrow(res, "Failed to upload image");
}

export async function removeStoreImage(kind) {
  const res = await apiFetch(`/seller/store/image/${kind}`, { method: "DELETE" });
  return parseOrThrow(res, "Failed to remove image");
}

// ----- public storefront -----
export async function getPublicStores({ limit = 8 } = {}) {
  return parseOrThrow(await apiFetch(`/stores?limit=${limit}`), "Failed to load stores");
}

export async function getPublicStore(id) {
  return parseOrThrow(await apiFetch(`/stores/${id}`), "Failed to load store");
}
export async function getStoreStatus() {
  return parseOrThrow(await apiFetch("/seller/store/status"), "Failed to load store status");
}