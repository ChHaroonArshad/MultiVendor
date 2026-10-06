import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function placeOrder(shippingAddress) {
  const res = await apiFetch("/checkout", {
    method: "POST",
    body: JSON.stringify({ shippingAddress }),
  });
  return parseOrThrow(res, "Failed to place order");
}