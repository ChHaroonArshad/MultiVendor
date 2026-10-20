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

const query = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  return p.toString();
};

export async function getChatStats() {
  return parseOrThrow(await apiFetch("/admin/chat/stats", { method: "GET" }), "Failed to load stats");
}
export async function getMonitorConversations({ filter = "all", search = "", page = 1, limit = 15 } = {}) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations?${query({ filter, search, page, limit })}`, { method: "GET" }), "Failed to load conversations");
}
export async function getMonitorReports({ status = "open", page = 1, limit = 15 } = {}) {
  return parseOrThrow(await apiFetch(`/admin/chat/reports?${query({ status, page, limit })}`, { method: "GET" }), "Failed to load reports");
}
export async function getMonitorConversation(id) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}`, { method: "GET" }), "Failed to load the conversation");
}
export async function getMonitorMessages(id, { before, after, reason, limit = 40 } = {}) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/messages?${query({ before, after, reason, limit })}`, { method: "GET" }), "Failed to load messages");
}
export async function getAccessLog(id) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/access-log`, { method: "GET" }), "Failed to load the access log");
}
export async function sendMediatorMessage(id, text) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/mediator-message`, { method: "POST", body: JSON.stringify({ text }) }), "Failed to send the message");
}
export async function lockChat(id, reason) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/lock`, { method: "POST", body: JSON.stringify({ reason }) }), "Failed to close the conversation");
}
export async function unlockChat(id) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/unlock`, { method: "POST" }), "Failed to reopen the conversation");
}
export async function resolveChatReports(id, { outcome, note }) {
  return parseOrThrow(await apiFetch(`/admin/chat/conversations/${id}/resolve`, { method: "POST", body: JSON.stringify({ outcome, note }) }), "Failed to resolve the reports");
}