import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.errors?.[0]?.message || json.message || fallbackMessage);
  return json;
}

export async function getNotifications({ page = 1, limit = 15, status = "all", category = "all" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status, category });
  return parseOrThrow(await apiFetch(`/notifications?${params.toString()}`), "Failed to load notifications");
}

export async function getUnreadCount() {
  return parseOrThrow(await apiFetch("/notifications/unread-count"), "Failed to load unread count");
}

export async function markNotificationRead(id) {
  return parseOrThrow(await apiFetch(`/notifications/${id}/read`, { method: "PATCH" }), "Failed to mark as read");
}

export async function markAllNotificationsRead() {
  return parseOrThrow(await apiFetch("/notifications/read-all", { method: "PATCH" }), "Failed to mark all as read");
}

export async function deleteNotification(id) {
  return parseOrThrow(await apiFetch(`/notifications/${id}`, { method: "DELETE" }), "Failed to delete notification");
}

export async function clearReadNotifications() {
  return parseOrThrow(await apiFetch("/notifications/read", { method: "DELETE" }), "Failed to clear notifications");
}