import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.errors?.[0]?.message || json.message || fallbackMessage);
  return json;
}

export async function getAdminReports({ page = 1, limit = 10, status = "active", type = "all", search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status, type });
  if (search) params.set("search", search);
  return parseOrThrow(await apiFetch(`/admin/reports?${params.toString()}`), "Failed to load reports");
}

export async function getAdminReportStats() {
  return parseOrThrow(await apiFetch("/admin/reports/stats"), "Failed to load stats");
}

export async function getAdminReport(id) {
  return parseOrThrow(await apiFetch(`/admin/reports/${id}`), "Failed to load report");
}

export async function startReportReview(id) {
  return parseOrThrow(await apiFetch(`/admin/reports/${id}/review`, { method: "PATCH" }), "Failed to start review");
}

export async function resolveReport(id, body) {
  const res = await apiFetch(`/admin/reports/${id}/resolve`, { method: "PATCH", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to close report");
}