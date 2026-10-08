import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function placeOrder(shippingAddress) {
  const res = await apiFetch("/checkout", { method: "POST", body: JSON.stringify({ shippingAddress }) });
  return parseOrThrow(res, "Failed to place order");
}

export async function confirmPayment(orderGroupId) {
  const res = await apiFetch(`/checkout/${orderGroupId}/confirm`, { method: "POST" });
  return parseOrThrow(res, "Failed to confirm payment");
}

export async function retryPayment(orderGroupId) {
  const res = await apiFetch(`/checkout/${orderGroupId}/retry-payment`, { method: "POST" });
  return parseOrThrow(res, "Failed to start payment retry");
}