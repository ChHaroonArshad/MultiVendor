const BASE_URL = import.meta.env.VITE_API_URL;

// Endpoints where a 401 means "bad input/credentials", not "session expired"
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];

let refreshPromise = null; // all simultaneous 401s share ONE refresh call
let sessionExpiredHandler = null;

// AuthContext registers itself here so api.js never imports React code
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
  const request = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include", // browser attaches the httpOnly cookies automatically
      headers: { "Content-Type": "application/json", ...options.headers },
    });

  let res = await request();

  if (res.status === 401 && !NO_REFRESH_PATHS.some((p) => path.startsWith(p))) {
    try {
      await refreshSession();
    } catch {
      sessionExpiredHandler?.(); // tell the app the session is gone; the app decides what to show
      return res;
    }
    res = await request();
  }

  return res;
}