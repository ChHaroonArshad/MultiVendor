import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getStoreStatus } from "../services/storeApi";

export const SellerStoreContext = createContext(null);

const isCompletion = (value) => Boolean(value) && typeof value.complete === "boolean" && Array.isArray(value.items);

export function SellerStoreProvider() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [completion, setCompletion] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  // Ignores anything that is not a real completion object, so a bad response can never poison the state.
  const applyCompletion = useCallback((next) => {
    if (isCompletion(next)) setCompletion(next);
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await getStoreStatus();
      if (!isCompletion(res.data.completion)) throw new Error("Unexpected store status response");
      setCompletion(res.data.completion);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { reload(); }, [reload, userId]);

  const value = useMemo(
    () => ({ completion, status, setCompletion: applyCompletion, reload }),
    [completion, status, applyCompletion, reload]
  );

  return (
    <SellerStoreContext.Provider value={value}>
      <Outlet />
    </SellerStoreContext.Provider>
  );
}