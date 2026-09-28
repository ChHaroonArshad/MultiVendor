import { apiFetch } from "./api.js";

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.errors?.[0]?.message || data.message || "Something went wrong.");
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function getCurrentUser() {
  const data = await parseResponse(await apiFetch("/auth/me"));
  return data.data.user;
}

export async function changePassword(body) {
  return parseResponse(await apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify(body) }));
}

export async function logout() {
  return parseResponse(await apiFetch("/auth/logout", { method: "POST" }));
}


// Not a fetch: Google login needs a full-page navigation so the browser can follow redirects
export function startGoogleLogin() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}