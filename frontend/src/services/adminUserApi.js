import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function getUsers({ page = 1, limit = 10, role = "all", status = "all", search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), role, status });
  if (search) params.set("search", search);
  const res = await apiFetch(`/admin/users?${params.toString()}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load users");
}

export async function getUserStats() {
  const res = await apiFetch("/admin/users/stats", { method: "GET" });
  return parseOrThrow(res, "Failed to load stats");
}

export async function getUser(id) {
  const res = await apiFetch(`/admin/users/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load user");
}

export async function suspendUser(id, reason) {
  const res = await apiFetch(`/admin/users/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return parseOrThrow(res, "Failed to suspend user");
}

export async function reactivateUser(id) {
  const res = await apiFetch(`/admin/users/${id}/reactivate`, { method: "PATCH" });
  return parseOrThrow(res, "Failed to reactivate user");
}