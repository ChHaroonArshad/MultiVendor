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

export async function createReport(body) {
  const res = await apiFetch("/reports", { method: "POST", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to send your report");
}

export async function submitSupportRequest(body) {
  const res = await apiFetch("/support", { method: "POST", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to send your message");
}

export async function getPublicStats() {
  const res = await apiFetch("/public/stats");
  return parseOrThrow(res, "Failed to load stats");
}