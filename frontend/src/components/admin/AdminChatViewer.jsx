import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
  getMonitorConversation, getMonitorMessages, sendMediatorMessage, lockChat, unlockChat, resolveChatReports, getAccessLog,
} from "../../services/adminChatApi";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Spinner";
import { ReasonModal } from "../ui/ReasonModal";
import { ConfirmActionModal } from "../ui/ConfirmActionModal";
import { dayLabel, isSameDay, formatTime, CATEGORY_LABEL } from "../../utils/chatUtils";

const SIDE_LABEL = { customer: "Customer", seller: "Seller", admin: "Support" };
const mergeUnique = (current, incoming) => {
  const seen = new Set(current.map((m) => m._id));
  return [...current, ...incoming.filter((m) => !seen.has(m._id))];
};

function AdminBubble({ message, onOpenImage }) {
  const [showHistory, setShowHistory] = useState(false);
  const side = message.senderSide;
  const align = side === "customer" ? "justify-start" : side === "seller" ? "justify-end" : "justify-center";
  const tone =
    side === "customer" ? "bg-white border border-[#E5E5E5] text-[#111111]"
    : side === "seller" ? "bg-[#111111] text-white"
    : "bg-[#FBF6E9] border border-[#C9A227]/40 text-[#111111]";

  return (
    <div className={`flex ${align} mt-3`}>
      <div className="max-w-[88%] sm:max-w-[72%]">
        <p className="text-[11px] text-[#6B6B6B] mb-1 mx-1">{message.sender?.name || "User"} · {SIDE_LABEL[side]} · {formatTime(message.createdAt)}</p>
        <div className={`${tone} ${message.deleted ? "border-dashed opacity-80" : ""} rounded-2xl px-3.5 py-2 text-sm shadow-sm`}>
          {message.deleted && <span className="inline-block text-[10px] uppercase tracking-wide bg-red-50 text-red-500 rounded-full px-2 py-0.5 mb-1">Deleted by sender</span>}

          {message.context && (
            <div className="bg-white/90 text-[#111111] border border-[#E5E5E5] rounded-xl px-2.5 py-1.5 mb-2 text-xs">
              <span className="text-[10px] uppercase text-[#B0B0B0]">{message.context.kind}</span>
              <p className="font-medium truncate">{message.context.title}</p>
              {message.context.subtitle && <p className="text-[#6B6B6B]">{message.context.subtitle}</p>}
            </div>
          )}

          {message.image && (
            <button type="button" onClick={() => onOpenImage(message.image)} className="block mb-1 overflow-hidden rounded-xl">
              <img src={message.image} alt="Shared" loading="lazy" className="max-h-56 max-w-[240px] object-cover" />
            </button>
          )}
          {message.deleted && message.type === "image" && !message.image && <p className="text-xs italic opacity-70">[image removed]</p>}

          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

          {message.edited && (
            <button type="button" onClick={() => setShowHistory((v) => !v)} className="mt-1 text-[10px] underline opacity-70">
              edited · {showHistory ? "hide" : "view"} earlier versions
            </button>
          )}
          {showHistory && (
            <div className="mt-1.5 space-y-1 border-t border-current/20 pt-1.5">
              {message.editHistory.map((e, i) => (
                <p key={i} className="text-xs opacity-80"><span className="opacity-60">{formatTime(e.at)}:</span> {e.text}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResolveModal({ open, submitting, onSubmit, onCancel }) {
  const [outcome, setOutcome] = useState("resolved");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setOutcome("resolved"); setNote(""); setError(""); } }, [open]);
  if (!open) return null;

  const submit = () => {
    if (note.trim().length < 5) { setError("Add a short internal note (at least 5 characters)."); return; }
    onSubmit({ outcome, note: note.trim() });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 chat-slide-up" onClick={submitting ? undefined : onCancel}>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-[#111111] mb-3">Resolve reports</p>
        <div className="space-y-2 mb-3">
          {[
            { value: "resolved", label: "Resolved: action was taken" },
            { value: "dismissed", label: "Dismissed: no violation found" },
          ].map((o) => (
            <button key={o.value} type="button" onClick={() => setOutcome(o.value)} className={`w-full text-left text-sm rounded-2xl border px-4 py-2.5 transition-colors ${outcome === o.value ? "border-[#C9A227] bg-[#FBF6E9]" : "border-[#E5E5E5] hover:border-[#C9A227]/50"}`}>
              {o.label}
            </button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} rows={3} maxLength={500} placeholder="Internal note: what happened and what you decided" className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] resize-none" />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <div className="flex flex-col gap-2 mt-4">
          <button onClick={submit} disabled={submitting} className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Spinner size={13} />} Save outcome
          </button>
          <button onClick={onCancel} disabled={submitting} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function AdminChatViewer({ conversationId, onBack, onChanged }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [granted, setGranted] = useState(false);
  const [needReason, setNeedReason] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [log, setLog] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const listRef = useRef(null);
  const stickRef = useRef(true);
  const restoreRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const loadMeta = useCallback(async () => {
    const res = await getMonitorConversation(conversationId);
    setMeta(res.data);
  }, [conversationId]);

  const openMessages = useCallback(
    async (reason) => {
      setOpening(true);
      try {
        const res = await getMonitorMessages(conversationId, { reason });
        stickRef.current = true;
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
        setGranted(true);
        setNeedReason(false);
        setError("");
      } catch (err) {
        if (err.errors?.some((e) => e.field === "reason_required")) setNeedReason(true);
        else setError(err.message || "Failed to load messages.");
      } finally {
        setOpening(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    let cancelled = false;
    setMeta(null); setMessages([]); setGranted(false); setNeedReason(false); setReasonText(""); setError(""); setLoading(true); setLog(null);
    (async () => {
      try {
        await loadMeta();
        if (!cancelled) await openMessages();
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load the conversation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId, loadMeta, openMessages]);

  // live-ish monitoring: fetch only what is newer than the last message every 8 seconds
  useEffect(() => {
    if (!granted) return undefined;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const last = messagesRef.current[messagesRef.current.length - 1];
      if (!last) return;
      try {
        const res = await getMonitorMessages(conversationId, { after: last._id });
        if (res.data.messages.length > 0) setMessages((prev) => mergeUnique(prev, res.data.messages));
      } catch {
        // next tick tries again
      }
    };
    const timer = setInterval(tick, 8000);
    return () => clearInterval(timer);
  }, [granted, conversationId]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (restoreRef.current != null) {
      el.scrollTop = el.scrollHeight - restoreRef.current;
      restoreRef.current = null;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const loadOlder = async () => {
    const oldest = messages[0];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getMonitorMessages(conversationId, { before: oldest._id });
      restoreRef.current = listRef.current ? listRef.current.scrollHeight : null;
      setMessages((prev) => [...res.data.messages.filter((m) => !prev.some((p) => p._id === m._id)), ...prev]);
      setHasMore(res.data.hasMore);
    } catch (err) {
      showToast(err.message || "Couldn't load older messages.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const afterAction = async () => {
    await loadMeta();
    try {
      const last = messagesRef.current[messagesRef.current.length - 1];
      const res = await getMonitorMessages(conversationId, last ? { after: last._id } : {});
      if (res.data.messages.length > 0) setMessages((prev) => mergeUnique(prev, res.data.messages));
    } catch {
      // the 8s refresh will catch up
    }
    onChanged?.();
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await sendMediatorMessage(conversationId, text);
      stickRef.current = true;
      setMessages((prev) => mergeUnique(prev, [res.data.message]));
      setDraft("");
    } catch (err) {
      showToast(err.message || "Failed to send the message.", "error");
    } finally {
      setSending(false);
    }
  };

  const runAction = async (fn, successMessage, closeModal) => {
    setActing(true);
    try {
      await fn();
      showToast(successMessage);
      closeModal();
      await afterAction();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setActing(false);
    }
  };

  const toggleLog = async () => {
    if (log) { setLog(null); return; }
    try {
      const res = await getAccessLog(conversationId);
      setLog(res.data.entries);
    } catch (err) {
      showToast(err.message || "Couldn't load the access history.", "error");
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[#6B6B6B]"><Spinner size={16} /> Loading...</div>;
  }
  if (error && !meta) {
    return <div className="flex-1 flex flex-col items-center justify-center gap-2"><p className="text-sm text-red-600">{error}</p><button onClick={onBack} className="text-xs text-[#C9A227] hover:underline md:hidden">Back</button></div>;
  }

  const c = meta.conversation;
  const openReports = meta.reports.filter((r) => r.status === "open");

  const PersonChip = ({ role, p }) =>
    p ? (
      <button onClick={() => navigate(`/admin/users/${p._id}`)} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-w-0">
        <Avatar name={p.name} src={p.avatar} size={34} />
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-wide text-[#B0B0B0]">{role}</span>
          <span className="block text-sm font-medium text-[#111111] truncate max-w-[140px]">{p.name}</span>
        </span>
      </button>
    ) : (
      <span className="text-xs text-[#B0B0B0]">{role}: deleted user</span>
    );

  return (
    <div className="chat-slide-in flex flex-col h-full min-w-0">
      <header className="px-3 sm:px-5 py-3 border-b border-[#E5E5E5] bg-white space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Back" className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F0F0F0]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
            <PersonChip role="Customer" p={c.customer} />
            <span className="text-[#B0B0B0]">↔</span>
            <PersonChip role="Seller" p={c.seller} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {c.openReports > 0 && <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-1">{c.openReports} open report{c.openReports > 1 ? "s" : ""}</span>}
          {c.locked && <span className="text-[11px] bg-[#FBEAEA] text-[#C0392B] rounded-full px-2.5 py-1">Closed by support</span>}
          {c.blocked && <span className="text-[11px] bg-[#F0F0F0] text-[#6B6B6B] rounded-full px-2.5 py-1">Blocked by a user</span>}
          <span className="flex-1" />
          {openReports.length > 0 && <button onClick={() => setResolveOpen(true)} className="text-xs font-medium bg-[#111111] text-white rounded-full px-3.5 py-1.5 hover:opacity-90">Resolve reports</button>}
          {c.locked ? (
            <button onClick={() => setUnlockOpen(true)} disabled={!granted} className="text-xs font-medium border border-[#E5E5E5] rounded-full px-3.5 py-1.5 hover:border-[#C9A227]/60 disabled:opacity-40">Reopen chat</button>
          ) : (
            <button onClick={() => setLockOpen(true)} disabled={!granted} className="text-xs font-medium border border-[#E5E5E5] text-[#C0392B] rounded-full px-3.5 py-1.5 hover:border-[#C0392B]/50 disabled:opacity-40">Close chat</button>
          )}
          <button onClick={toggleLog} className="text-xs text-[#6B6B6B] hover:text-[#111111] underline underline-offset-2">{log ? "Hide" : "Access history"}</button>
        </div>

        {openReports.length > 0 && (
          <div className="space-y-1.5">
            {openReports.map((r) => (
              <div key={r._id} className="text-xs bg-red-50/60 border border-red-100 rounded-xl px-3 py-2">
                <p className="text-[#111111]"><span className="font-medium">{CATEGORY_LABEL[r.category]}</span> · reported by {r.reporter?.name || "a user"} ({r.reporterSide}) against {r.against?.name || "a user"}</p>
                {r.details && <p className="text-[#6B6B6B] mt-0.5">“{r.details}”</p>}
              </div>
            ))}
          </div>
        )}

        {log && (
          <div className="text-xs bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2 max-h-32 overflow-y-auto chat-scroll space-y-1">
            {log.length === 0 && <p className="text-[#B0B0B0]">No access recorded yet.</p>}
            {log.map((e) => (
              <p key={e._id} className="text-[#6B6B6B]"><span className="text-[#111111]">{e.admin}</span> · {e.action.replace("_", " ")} · {new Date(e.createdAt).toLocaleString()}{e.reason ? ` · “${e.reason}”` : ""}</p>
            ))}
          </div>
        )}
      </header>

      <div className="relative flex-1 min-h-0">
        {needReason && (
          <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-6 bg-[#FBFAF7]">
            <div className="w-full max-w-sm bg-white border border-[#E5E5E5] rounded-3xl p-6 text-center chat-slide-up">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-medium text-[#111111] mb-1">Private conversation</p>
              <p className="text-xs text-[#6B6B6B] mb-4">Opening it is recorded in the access log with your name and reason. Only open chats you need for a dispute or a safety check.</p>
              <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={3} maxLength={300} placeholder="Why are you opening this conversation?" className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] resize-none mb-3" />
              <button onClick={() => openMessages(reasonText)} disabled={opening || reasonText.trim().length < 5} className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                {opening && <Spinner size={13} />} Open conversation
              </button>
            </div>
          </div>
        )}

        {granted && (
          <div ref={listRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto chat-scroll px-3 sm:px-6 py-4 bg-[#FBFAF7]">
            {hasMore && (
              <div className="flex justify-center mb-2">
                <button onClick={loadOlder} disabled={loadingMore} className="text-xs text-[#C9A227] hover:underline flex items-center gap-2">{loadingMore && <Spinner size={12} />} Load earlier messages</button>
              </div>
            )}
            {messages.length === 0 && <p className="text-center text-xs text-[#B0B0B0] py-10">No messages in this conversation.</p>}
            {messages.map((m, i) => (
              <div key={m._id}>
                {(i === 0 || !isSameDay(messages[i - 1].createdAt, m.createdAt)) && (
                  <div className="flex justify-center my-4"><span className="text-[11px] text-[#6B6B6B] bg-white border border-[#E5E5E5] rounded-full px-3 py-1">{dayLabel(m.createdAt)}</span></div>
                )}
                <AdminBubble message={m} onOpenImage={setLightbox} />
              </div>
            ))}
          </div>
        )}
        {error && !needReason && !granted && <p className="absolute inset-0 flex items-center justify-center text-sm text-red-600">{error}</p>}
      </div>

      <div className="border-t border-[#E5E5E5] bg-white px-3 sm:px-4 py-3 ">
        <p className="text-[11px] text-[#8a6f14] mb-1.5">"You can only read the messages from both sides”</p>
        <div className="flex items-end gap-2">
          {/* <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            maxLength={1000}
            disabled={!granted}
            placeholder={granted ? "Write to both parties as mediator..." : "Open the conversation first"}
            className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] focus:bg-white max-h-28 disabled:opacity-50"
          /> */}
          {/* <button onClick={handleSend} disabled={!granted || !draft.trim() || sending} className="shrink-0 h-10 px-5 rounded-full bg-[#111111] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
            {sending && <Spinner size={12} />} Send
          </button> */}
        </div>
      </div>

      <ReasonModal open={lockOpen} title="Close this conversation?" description="Neither person can send messages until you reopen it. They'll both see this reason." placeholder="e.g. Repeated abusive messages" confirmLabel="Close conversation" submitting={acting} onSubmit={(reason) => runAction(() => lockChat(conversationId, reason), "Conversation closed", () => setLockOpen(false))} onCancel={() => setLockOpen(false)} />
      <ConfirmActionModal open={unlockOpen} title="Reopen this conversation?" message="Both people will be able to send messages again and will be notified." confirmLabel="Reopen" loading={acting} onConfirm={() => runAction(() => unlockChat(conversationId), "Conversation reopened", () => setUnlockOpen(false))} onCancel={() => setUnlockOpen(false)} />
      <ResolveModal open={resolveOpen} submitting={acting} onSubmit={(body) => runAction(() => resolveChatReports(conversationId, body), "Reports updated", () => setResolveOpen(false))} onCancel={() => setResolveOpen(false)} />

      {lightbox && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Shared" className="max-h-[85vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}