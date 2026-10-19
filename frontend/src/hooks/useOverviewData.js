import { useCallback, useEffect, useRef, useState } from "react";

export function useOverviewData(fetcher, deps = [], refreshMs = 60_000) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestRef = useRef(0);
  const loadedRef = useRef(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent) => {
    const id = ++requestRef.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetcherRef.current();
      if (id !== requestRef.current) return;
      setData(res.data);
      setError("");
      loadedRef.current = true;
    } catch (err) {
      if (id !== requestRef.current) return;
      if (!silent) setError(err.message || "Failed to load.");
    } finally {
      if (id === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Re-runs when deps change (e.g. the chart range), silently once data already exists.
  useEffect(() => { load(loadedRef.current); }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, refreshMs);
    return () => clearInterval(timer);
  }, [load, refreshMs]);

  return { data, loading, refreshing, error, reload: () => load(false), refresh: () => load(true) };
}