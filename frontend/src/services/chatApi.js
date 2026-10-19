import { apiFetch } from "./api";

async function parseOrThrow(res, fallbackMessage) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || fallbackMessage);
  return json;
}

export async function getConversations({ search = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  const res = await apiFetch(`/chat/conversations?${params.toString()}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load conversations");
}

export async function startConversation(body) {
  const res = await apiFetch("/chat/conversations", { method: "POST", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to start the conversation");
}

export async function getConversation(id) {
  const res = await apiFetch(`/chat/conversations/${id}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load the conversation");
}

export async function getMessages(conversationId, { before, limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const res = await apiFetch(`/chat/conversations/${conversationId}/messages?${params.toString()}`, { method: "GET" });
  return parseOrThrow(res, "Failed to load messages");
}

export async function sendChatMessage(conversationId, { text = "", clientId, contextKind, contextId, imageFile }) {
  let body;
  if (imageFile) {
    body = new FormData(); // apiFetch leaves the Content-Type to the browser for FormData
    body.append("text", text);
    body.append("clientId", clientId);
    body.append("image", imageFile);
    if (contextKind) {
      body.append("contextKind", contextKind);
      body.append("contextId", contextId);
    }
  } else {
    body = JSON.stringify({ text, clientId, ...(contextKind ? { contextKind, contextId } : {}) });
  }
  const res = await apiFetch(`/chat/conversations/${conversationId}/messages`, { method: "POST", body });
  return parseOrThrow(res, "Failed to send the message");
}

export async function markConversationRead(id) {
  const res = await apiFetch(`/chat/conversations/${id}/read`, { method: "POST" });
  return parseOrThrow(res, "Failed to mark as read");
}

export async function blockConversation(id) {
  const res = await apiFetch(`/chat/conversations/${id}/block`, { method: "POST" });
  return parseOrThrow(res, "Failed to block");
}

export async function unblockConversation(id) {
  const res = await apiFetch(`/chat/conversations/${id}/block`, { method: "DELETE" });
  return parseOrThrow(res, "Failed to unblock");
}

export async function deleteChatMessage(id) {
  const res = await apiFetch(`/chat/messages/${id}`, { method: "DELETE" });
  return parseOrThrow(res, "Failed to delete the message");
}

export async function getChatUnreadCount() {
  const res = await apiFetch("/chat/unread-count", { method: "GET" });
  return parseOrThrow(res, "Failed to load unread count");
}