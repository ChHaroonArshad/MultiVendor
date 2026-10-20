import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { getChatUnreadCount } from "../services/chatApi";
import { ChatStyles } from "../components/chat/ChatStyles";

const ChatContext = createContext(null);

// VITE_API_URL ends in /api/v1, the socket lives on the same origin.
const SOCKET_URL = new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
const EVENTS = [
  "message:new", "messages:read", "messages:delivered", "message:deleted", "message:edited",
  "conversation:update", "conversation:removed", "presence:update", "typing",
];

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userKey = user ? String(user._id ?? user.id ?? user.email) : null;

  const [totalUnread, setTotalUnread] = useState(0);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const refreshTimerRef = useRef(null);
  const retryRef = useRef({ count: 0, timer: null });

  const refreshUnread = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await getChatUnreadCount();
        setTotalUnread(res.data.unread);
      } catch {
        // the next event or focus tries again
      }
    }, 300);
  }, []);

  // Pages register interest in socket events here instead of opening their own sockets.
  const subscribe = useCallback((event, handler) => {
    const map = listenersRef.current;
    if (!map.has(event)) map.set(event, new Set());
    map.get(event).add(handler);
    return () => map.get(event)?.delete(handler);
  }, []);

  const emitTyping = useCallback((conversationId, isTyping) => {
    socketRef.current?.emit("typing", { conversationId, isTyping });
  }, []);

  useEffect(() => {
    if (!userKey) {
      setTotalUnread(0);
      setConnected(false);
      return undefined;
    }

    refreshUnread();

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    EVENTS.forEach((event) => {
      socket.on(event, (payload) => {
        listenersRef.current.get(event)?.forEach((handler) => handler(payload));
       if (["message:new", "messages:read", "message:deleted", "conversation:removed"].includes(event)) refreshUnread();
      });
    });

    socket.on("connect", () => {
      retryRef.current.count = 0;
      setConnected(true);
      refreshUnread();
    });
    socket.on("disconnect", () => setConnected(false));

    // The access cookie lives 15 minutes. If the socket is rejected, make one cheap API call (apiFetch
    // refreshes the cookie on a 401) and reconnect, with backoff and a hard stop.
    socket.on("connect_error", (err) => {
      setConnected(false);
      if (err?.message !== "unauthorized") return; // network errors are retried by Socket.IO itself
      const attempt = ++retryRef.current.count;
      if (attempt > 5) return;
      clearTimeout(retryRef.current.timer);
      retryRef.current.timer = setTimeout(async () => {
        try {
          await getChatUnreadCount();
        } catch {
          return; // the session is really gone
        }
        socket.connect();
      }, Math.min(1000 * 2 ** attempt, 15000));
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshUnread();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(refreshTimerRef.current);
      clearTimeout(retryRef.current.timer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userKey, refreshUnread]);

  const value = useMemo(
    () => ({ totalUnread, connected, subscribe, emitTyping, refreshUnread }),
    [totalUnread, connected, subscribe, emitTyping, refreshUnread]
  );

  return (
    <ChatContext.Provider value={value}>
      <ChatStyles />
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}