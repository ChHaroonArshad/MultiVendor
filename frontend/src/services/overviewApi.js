import { apiFetch } from "./api";

async function parse(res, fallback) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallback);
  return json;
}

export async function getSellerOverview(range = "7") {
  return parse(await apiFetch(`/seller/overview?range=${range}`, { method: "GET" }), "Failed to load your overview");
}

export async function getCustomerOverview() {
  return parse(await apiFetch("/customer/overview", { method: "GET" }), "Failed to load your overview");
}