import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import {
  getMessages, sendChatMessage, markConversationRead, blockConversation, unblockConversation,
  deleteChatMessage, editChatMessage, deleteConversation,
} from "../../services/chatApi";
import { ChatAvatar } from "./ChatAvatar";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { ReportConversationModal } from "./ReportConversationModal";
import { RowActionsMenu } from "../ui/RowActionsMenu";
import { ConfirmActionModal } from "../ui/ConfirmActionModal";
import { Spinner } from "../ui/Spinner";
import { dayLabel, isSameDay, getQuickReplies, newClientId, EDIT_WINDOW_MS } from "../../utils/chatUtils";

const PAGE_SIZE = 30;
const GROUP_GAP_MS = 5 * 60 * 1000;
const isTemp = (m) => String(m._id).startsWith("tmp-");

function upsertMessage(list, incoming) {
  const byId = list.findIndex((m) => m._id === incoming._id);
  if (byId !== -1) {
    const copy = [...list];
    copy[byId] = { ...copy[byId], ...incoming, pending: false, failed: false };
    return copy;
  }
  const byClient = incoming.clientId ? list.findIndex((m) => m.clientId === incoming.clientId) : -1;
  if (byClient !== -1) {
    const copy = [...list];
    copy[byClient] = { ...incoming, isNew: copy[byClient].isNew, pending: false, failed: false };
    return copy;
  }
  return [...list, incoming];
}

export function ChatThread({ conversation, onBack, onPatch, onRemoved, pendingContext, onClearContext }) {
  const { user } = useAuth();
  const { subscribe, emitTyping } = useChat();
  const { showToast } = useToast();

  const me = useMemo(() => ({ id: String(user._id ?? user.id), name: user.name, avatar: user.avatar || null }), [user]);
  const conversationId = conversation._id;
  const mySide = conversation.mySide;
  const counterpart = conversation.counterpart;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const [newBelow, setNewBelow] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [unreadAtLoad, setUnreadAtLoad] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const scrollRef = useRef(null);
  const stickRef = useRef(true);
  const scrollModeRef = useRef("auto");
  const restoreRef = useRef(null);
  const typingTimerRef = useRef(null);
  const readTimerRef = useRef(null);
  const failedPayloadsRef = useRef(new Map());
  const conversationRef = useRef(conversation);

  useEffect(() => { conversationRef.current = conversation; });

  const markReadSoon = useCallback(() => {
    clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await markConversationRead(conversationId);
        onPatch(conversationId, { unread: 0 });
      } catch {
        // retried on the next message or window focus
      }
    }, 250);
  }, [conversationId, onPatch]);

  useEffect(() => {
    let cancelled = false;
    setMessages([]); setHasMore(false); setLoading(true); setError(""); setTyping(false);
    setNewBelow(0); setShowJump(false); setFirstUnreadId(null); setUnreadAtLoad(0); setEditTarget(null);
    stickRef.current = true;
    scrollModeRef.current = "auto";

    getMessages(conversationId, { limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        const list = res.data.messages;
        const unreadList = list.filter((m) => m.senderSide !== mySide && !m.readAt && !m.deleted);
        setFirstUnreadId(unreadList[0]?._id || null);
        setUnreadAtLoad(unreadList.length);
        setMessages(list);
        setHasMore(res.data.hasMore);
        if (unreadList.length > 0 || conversationRef.current.unread > 0) markReadSoon();
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load messages."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; clearTimeout(readTimerRef.current); };
  }, [conversationId, mySide, markReadSoon]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreRef.current != null) {
      el.scrollTop = el.scrollHeight - restoreRef.current;
      restoreRef.current = null;
      return;
    }
    if (stickRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: scrollModeRef.current });
      scrollModeRef.current = "smooth";
    }
  }, [messages, typing]);

  const loadOlder = useCallback(async () => {
    const oldest = messages.find((m) => !isTemp(m));
    if (!oldest || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getMessages(conversationId, { before: oldest._id, limit: PAGE_SIZE });
      restoreRef.current = scrollRef.current ? scrollRef.current.scrollHeight : null;
      setMessages((prev) => [...res.data.messages.filter((m) => !prev.some((p) => p._id === m._id)), ...prev]);
      setHasMore(res.data.hasMore);
    } catch {
      showToast("Couldn't load older messages.", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [messages, loadingMore, hasMore, conversationId, showToast]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distance < 120;
    setShowJump(distance > 300);
    if (distance < 60) {
      setNewBelow(0);
      if (conversationRef.current.unread > 0) markReadSoon();
    }
    if (el.scrollTop < 80 && hasMore && !loadingMore) loadOlder();
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    stickRef.current = true;
    setNewBelow(0);
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    if (conversationRef.current.unread > 0) markReadSoon();
  };

  // ---- live events ----
  useEffect(() => {
    const offNew = subscribe("message:new", ({ message }) => {
      if (message.conversation !== conversationId) return;
      setMessages((prev) => upsertMessage(prev, { ...message, isNew: true }));
      if (message.senderSide === mySide) return;
      setTyping(false);
      if (stickRef.current && document.visibilityState === "visible") markReadSoon();
      else setNewBelow((n) => n + 1);
    });

    const offRead = subscribe("messages:read", ({ conversationId: id, readerSide, at }) => {
      if (id !== conversationId || readerSide === mySide) return;
      setMessages((prev) => prev.map((m) => (m.senderSide === mySide && !m.readAt ? { ...m, deliveredAt: m.deliveredAt || at, readAt: at } : m)));
    });

    const offDelivered = subscribe("messages:delivered", ({ conversationId: id, at }) => {
      if (id !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.senderSide === mySide && !m.deliveredAt && !m.pending ? { ...m, deliveredAt: at } : m)));
    });

    const offEdited = subscribe("message:edited", ({ conversationId: id, message }) => {
      if (id !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, ...message } : m)));
    });

    const offDeleted = subscribe("message:deleted", ({ conversationId: id, messageId }) => {
      if (id !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, deleted: true, text: "", image: null, context: null } : m)));
    });

    const offTyping = subscribe("typing", ({ conversationId: id, side, isTyping }) => {
      if (id !== conversationId || side === mySide) return;
      setTyping(Boolean(isTyping));
      clearTimeout(typingTimerRef.current);
      if (isTyping) typingTimerRef.current = setTimeout(() => setTyping(false), 4500);
    });

    return () => {
      offNew(); offRead(); offDelivered(); offEdited(); offDeleted(); offTyping();
      clearTimeout(typingTimerRef.current);
    };
  }, [subscribe, conversationId, mySide, markReadSoon]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && conversationRef.current.unread > 0) markReadSoon();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markReadSoon]);

  // ---- sending (optimistic) ----
  const deliver = useCallback(
    async (clientId, payload) => {
      try {
        const res = await sendChatMessage(conversationId, { ...payload, clientId });
        failedPayloadsRef.current.delete(clientId);
        setMessages((prev) => upsertMessage(prev, res.data.message));
      } catch (err) {
        failedPayloadsRef.current.set(clientId, payload);
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, pending: false, failed: true } : m)));
        showToast(err.message || "Failed to send the message.", "error");
      }
    },
    [conversationId, showToast]
  );

  const handleSend = ({ text, image, context }) => {
    const clientId = newClientId();
    const temp = {
      _id: `tmp-${clientId}`, clientId, conversation: conversationId, senderSide: mySide,
      sender: { _id: me.id, name: me.name, avatar: me.avatar },
      type: image ? "image" : "text", text, image: image ? image.previewUrl : null,
      context: context ? { kind: context.kind, refId: context.refId, title: context.title, subtitle: context.subtitle, image: context.image } : null,
      deliveredAt: null, readAt: null, edited: false, deleted: false,
      createdAt: new Date().toISOString(), pending: true, isNew: true,
    };
    stickRef.current = true;
    setMessages((prev) => [...prev, temp]);
    deliver(clientId, { text, imageFile: image?.file, contextKind: context?.kind, contextId: context?.refId });
  };

  const handleRetry = (message) => {
    const payload = failedPayloadsRef.current.get(message.clientId);
    if (!payload) return;
    setMessages((prev) => prev.map((m) => (m.clientId === message.clientId ? { ...m, pending: true, failed: false } : m)));
    deliver(message.clientId, payload);
  };

  const handleSubmitEdit = async (text) => {
    const target = editTarget;
    if (!target) return;
    setEditTarget(null);
    if (text === target.text) return;
    setMessages((prev) => prev.map((m) => (m._id === target._id ? { ...m, text, edited: true } : m)));
    try {
      const res = await editChatMessage(target._id, text);
      setMessages((prev) => prev.map((m) => (m._id === target._id ? { ...m, ...res.data.message } : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m._id === target._id ? target : m)));
      showToast(err.message || "Couldn't edit the message.", "error");
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    setMessages((prev) => prev.map((m) => (m._id === target._id ? { ...m, deleted: true, text: "", image: null, context: null } : m)));
    try {
      await deleteChatMessage(target._id);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m._id === target._id ? target : m)));
      showToast(err.message || "Couldn't delete the message.", "error");
    }
  };

  const handleToggleBlock = async () => {
    setBlocking(true);
    try {
      const res = conversation.blockedByMe ? await unblockConversation(conversationId) : await blockConversation(conversationId);
      onPatch(conversationId, res.data.conversation);
      showToast(conversation.blockedByMe ? "Unblocked" : "Blocked. Neither of you can send messages now.");
      setBlockOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to update.", "error");
    } finally {
      setBlocking(false);
    }
  };

  const handleRemoveConversation = async () => {
    setRemoving(true);
    try {
      await deleteConversation(conversationId);
      showToast("Conversation deleted");
      onRemoved(conversationId);
    } catch (err) {
      showToast(err.message || "Couldn't delete the conversation.", "error");
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  // ---- rows ----
  const rows = useMemo(() => {
    const senderId = (m) => m.sender?._id || m.senderSide;
    const sameGroup = (a, b) =>
      a && b && a.senderSide === b.senderSide && senderId(a) === senderId(b) &&
      isSameDay(a.createdAt, b.createdAt) && Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) < GROUP_GAP_MS;

    const out = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      if (!prev || !isSameDay(prev.createdAt, m.createdAt)) out.push({ kind: "day", key: `day-${m._id}`, label: dayLabel(m.createdAt) });
      if (m._id === firstUnreadId) out.push({ kind: "unread", key: "unread-divider" });
      out.push({ kind: "message", key: m._id, message: m, first: !sameGroup(prev, m), last: !sameGroup(m, next) });
    });
    return out;
  }, [messages, firstUnreadId]);

  const isFromMe = (m) => m.senderSide === mySide;
  const isMediator = (m) => m.senderSide === "admin" && conversation.type === "direct";
  const closed = conversation.blocked || conversation.locked;

  const canEditMessage = (m) =>
    m.sender?._id === me.id && m.type === "text" && !m.deleted && !m.pending && !m.failed && !closed &&
    Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;

  const statusLine = typing ? "typing..." : counterpart.role === "support" ? "We usually reply within a day" : conversation.type === "support" ? "Seller · support chat" : counterpart.online ? "Online" : "Offline";

  const disabledReason = conversation.locked
    ? `This conversation was closed by Marketplace Support${conversation.lockReason ? `: ${conversation.lockReason}` : "."}`
    : conversation.blocked
    ? conversation.blockedByMe
      ? "You blocked this person. Unblock them from the menu to chat again."
      : "This conversation is closed for replies."
    : "";

  const menuItems = [];
  if (conversation.type === "direct") {
    menuItems.push({ key: "report", label: "Report conversation", danger: true, onClick: () => setReportOpen(true) });
    menuItems.push({
      key: "block",
      label: conversation.blockedByMe ? "Unblock this person" : "Block this person",
      danger: !conversation.blockedByMe,
      onClick: conversation.blockedByMe ? handleToggleBlock : () => setBlockOpen(true),
    });
  }
  if (mySide !== "admin") menuItems.push({ key: "remove", label: "Delete conversation", danger: true, onClick: () => setRemoveOpen(true) });

  return (
    <div className="chat-slide-in flex flex-col h-full min-w-0">
      <header className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-[#E5E5E5] bg-white">
        <button onClick={onBack} aria-label="Back to conversations" className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#F0F0F0] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <ChatAvatar counterpart={counterpart} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#111111] truncate">{counterpart.name}</p>
          <p className={`text-xs truncate transition-colors ${typing || counterpart.online ? "text-[#2E7D32]" : "text-[#6B6B6B]"}`}>{statusLine}</p>
        </div>
        {menuItems.length > 0 && <RowActionsMenu items={menuItems} busy={blocking} label="Conversation actions" />}
      </header>

      <div className="relative flex-1 min-h-0">
        <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto chat-scroll px-3 sm:px-6 py-4 bg-[#FBFAF7]">
          {loadingMore && <div className="flex justify-center py-2"><Spinner size={14} className="text-[#6B6B6B]" /></div>}

          {loading && (
            <div className="space-y-4 pt-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                  <div className="chat-skeleton h-10 rounded-2xl" style={{ width: `${40 + ((i * 17) % 35)}%` }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-10">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button onClick={() => window.location.reload()} className="text-xs text-[#C9A227] hover:underline">Try again</button>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="chat-slide-up text-center py-16 px-6">
              <div className="chat-bob text-4xl mb-3">👋</div>
              <p className="text-sm font-medium text-[#111111] mb-1">Start the conversation</p>
              <p className="text-xs text-[#6B6B6B]">Say hello to {counterpart.name}. Pick a quick reply below or write your own.</p>
            </div>
          )}

          {!loading && !hasMore && messages.length > 0 && <p className="text-center text-[11px] text-[#B0B0B0] pb-2">Beginning of your conversation</p>}

          {!loading && conversation.type === "direct" && (
            <p className="text-center text-[11px] text-[#B0B0B0] pb-3 px-4">🔒 Marketplace Support may review this conversation to help resolve disputes.</p>
          )}

          {rows.map((row) => {
            if (row.kind === "day") {
              return (
                <div key={row.key} className="flex justify-center my-4">
                  <span className="text-[11px] text-[#6B6B6B] bg-white border border-[#E5E5E5] rounded-full px-3 py-1 shadow-sm">{row.label}</span>
                </div>
              );
            }
            if (row.kind === "unread") {
              return (
                <div key={row.key} className="chat-slide-up flex items-center gap-3 my-3">
                  <span className="flex-1 h-px bg-[#C9A227]/40" />
                  <span className="text-[11px] font-medium text-[#8a6f14]">{unreadAtLoad} new message{unreadAtLoad === 1 ? "" : "s"}</span>
                  <span className="flex-1 h-px bg-[#C9A227]/40" />
                </div>
              );
            }

            const { message, first, last } = row;
            const mine = isFromMe(message);
            const fromOtherAdmin = mine && mySide === "admin" && message.sender?._id !== me.id;
            const nameLabel = first
              ? fromOtherAdmin ? `${message.sender?.name || "Admin"} (admin)`
              : !mine && message.senderSide === "admin" ? `Support · ${message.sender?.name || "Admin"}`
              : null
              : null;

            return (
              <MessageBubble
                key={row.key}
                message={message}
                mine={mine}
                first={first}
                last={last}
                nameLabel={nameLabel}
                moderator={isMediator(message)}
                viewerRole={user.role}
                canEdit={canEditMessage(message)}
                canDelete={message.sender?._id === me.id && !message.pending && !message.failed}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onRetry={handleRetry}
                onOpenImage={setLightbox}
              />
            );
          })}

          {typing && <TypingIndicator />}
        </div>

        {showJump && (
          <button onClick={jumpToLatest} aria-label="Jump to latest message" className="chat-pop absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white border border-[#E5E5E5] shadow-md flex items-center justify-center hover:-translate-y-0.5 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            {newBelow > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#C9A227] text-white text-[10px] flex items-center justify-center">{newBelow}</span>}
          </button>
        )}
      </div>

      <MessageComposer
        disabled={closed}
        disabledReason={disabledReason}
        quickReplies={getQuickReplies(user.role, conversation.type)}
        pendingContext={pendingContext}
        onClearContext={onClearContext}
        onSend={handleSend}
        onTyping={(isTyping) => emitTyping(conversationId, isTyping)}
        editing={editTarget}
        onSubmitEdit={handleSubmitEdit}
        onCancelEdit={() => setEditTarget(null)}
      />

      <ConfirmActionModal open={Boolean(deleteTarget)} title="Delete this message?" message="It will be replaced by 'This message was deleted' for both of you." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ConfirmActionModal open={blockOpen} title={`Block ${counterpart.name}?`} message="Neither of you will be able to send messages in this conversation until you unblock." confirmLabel="Block" danger loading={blocking} onConfirm={handleToggleBlock} onCancel={() => setBlockOpen(false)} />
      <ConfirmActionModal
        open={removeOpen}
        title="Delete this conversation?"
        message="It disappears from your list and your history is cleared. The other person keeps their copy, and Marketplace Support can still review it if a dispute is reported."
        confirmLabel="Delete"
        danger
        loading={removing}
        onConfirm={handleRemoveConversation}
        onCancel={() => setRemoveOpen(false)}
      />
      <ReportConversationModal open={reportOpen} conversationId={conversationId} onClose={() => setReportOpen(false)} />

      {lightbox && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 chat-slide-up" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="Close" onClick={() => setLightbox(null)}>✕</button>
          <img src={lightbox} alt="Shared" className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}