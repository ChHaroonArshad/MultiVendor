const BASE_URL = import.meta.env.VITE_API_URL;

const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/google",
];

let refreshPromise = null;
let sessionExpiredHandler = null;

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Refresh failed");
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const request = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: isFormData
        ? { ...options.headers } // let the browser set Content-Type + boundary itself
        : { "Content-Type": "application/json", ...options.headers },
    });

  let res = await request();

  if (res.status === 401 && !NO_REFRESH_PATHS.some((p) => path.startsWith(p))) {
    try {
      await refreshSession();
    } catch {
      sessionExpiredHandler?.();
      return res;
    }
    res = await request();
  }

  return res;
}