import { apiFetch } from "./api";

export async function getAdminOverview() {
  const res = await apiFetch("/admin/overview", { method: "GET" });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to load the overview");
  return json;
}