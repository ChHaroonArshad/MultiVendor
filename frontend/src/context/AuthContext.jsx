import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, logout as logoutRequest } from "../services/authApi";
import { setSessionExpiredHandler } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first /auth/me answer arrives

  // Initial "who am I?" check. The cancelled flag ignores the discarded StrictMode run.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) setUser(null); }) // guest, or session dead
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // If a refresh fails while the user is browsing, drop them to the logged-out state
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const signIn = useCallback((loggedInUser) => setUser(loggedInUser), []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // even if the request fails, clear local state
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await getCurrentUser();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), signIn, logout, refreshUser }),
    [user, loading, signIn, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}