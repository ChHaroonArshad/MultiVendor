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

export async function updateProfile(body) {
  const res = await apiFetch("/account/profile", { method: "PATCH", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to update profile");
}

export async function uploadAvatar(file) {
  const body = new FormData();
  body.append("avatar", file); // apiFetch lets the browser set the multipart boundary
  const res = await apiFetch("/account/avatar", { method: "POST", body });
  return parseOrThrow(res, "Failed to upload photo");
}

export async function removeAvatar() {
  const res = await apiFetch("/account/avatar", { method: "DELETE" });
  return parseOrThrow(res, "Failed to remove photo");
}

export async function updatePreferences(body) {
  const res = await apiFetch("/account/preferences", { method: "PATCH", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to save preferences");
}


export async function deleteAccount(body) {
  const res = await apiFetch("/account/delete", { method: "POST", body: JSON.stringify(body) });
  return parseOrThrow(res, "Failed to delete account");
}