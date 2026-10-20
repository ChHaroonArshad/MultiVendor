import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../context/ChatContext";
import { useToast } from "../context/ToastContext";
import { getConversations, getConversation, startConversation } from "../services/chatApi";
import { getPublicProduct } from "../services/publicProductApi";
import { ConversationList } from "../components/chat/ConversationList";
import { ChatThread } from "../components/chat/ChatThread";
import { Spinner } from "../components/ui/Spinner";
import { shortOrderId } from "../utils/orderUtils";

const LIMIT = 20;

const EMPTY_HINT = {
  customer: "Open a store or an order and tap “Message” to ask a question.",
  seller: "Customers who message you will appear here. You can also contact support.",
  admin: "Seller support requests will appear here. Message a seller from the Users page.",
};

function upsert(list, conversation, keepPosition) {
  const index = list.findIndex((c) => c._id === conversation._id);
  if (index === -1) return [conversation, ...list];
  if (keepPosition) {
    const copy = [...list];
    copy[index] = { ...copy[index], ...conversation };
    return copy;
  }
  return [{ ...list[index], ...conversation }, ...list.filter((c) => c._id !== conversation._id)];
}

export function ChatPage() {
  const { user } = useAuth();
  const { subscribe, totalUnread } = useChat();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(searchParams.get("c"));
  const [pendingContext, setPendingContext] = useState(null);
  const [starting, setStarting] = useState(false);

  const requestRef = useRef(0);
  const activeIdRef = useRef(activeId);
  const startedRef = useRef(false);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const fetchList = useCallback(
    async (page = 1) => {
      const requestId = ++requestRef.current;
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const res = await getConversations({ search, page, limit: LIMIT });
        if (requestId !== requestRef.current) return;
        const incoming = res.data.conversations;
        setConversations((prev) => {
          if (page > 1) return [...prev, ...incoming.filter((c) => !prev.some((p) => p._id === c._id))];
          const drafts = search ? [] : prev.filter((c) => c.draft && !incoming.some((i) => i._id === c._id));
          return [...drafts, ...incoming];
        });
        setPagination(res.data.pagination);
        setHasLoaded(true);
      } catch (err) {
        if (requestId === requestRef.current) setError(err.message || "Failed to load conversations.");
      } finally {
        if (requestId === requestRef.current) { setLoading(false); setLoadingMore(false); }
      }
    },
    [search]
  );

  useEffect(() => { fetchList(1); }, [fetchList]);

  const applySearch = useMemo(() => debounce((value) => setSearch(value.trim()), 450), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    applySearch(e.target.value);
  };

  const clearSearch = () => {
    applySearch.cancel();
    setSearchInput("");
    setSearch("");
  };

  const patchConversation = useCallback((id, patch) => {
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  }, []);

  useEffect(() => {
    const offNew = subscribe("message:new", ({ message, conversation }) => {
      const incoming = message.senderSide !== conversation.mySide;
      const viewing = activeIdRef.current === conversation._id && document.visibilityState === "visible";
      setConversations((prev) => upsert(prev, incoming && viewing ? { ...conversation, unread: 0 } : conversation, false));
    });
    const offUpdate = subscribe("conversation:update", ({ conversation }) => setConversations((prev) => upsert(prev, conversation, true)));
    const offDeleted = subscribe("message:deleted", ({ conversation }) => setConversations((prev) => upsert(prev, conversation, true)));
    const offEdited = subscribe("message:edited", ({ conversation }) => setConversations((prev) => upsert(prev, conversation, true)));
    const offRead = subscribe("messages:read", ({ conversationId, readerSide }) =>
      setConversations((prev) => prev.map((c) => (c._id === conversationId && c.mySide === readerSide ? { ...c, unread: 0 } : c)))
    );
    const offRemoved = subscribe("conversation:removed", ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeIdRef.current === conversationId) {
        setActiveId(null);
        setSearchParams({}, { replace: true });
      }
    });
    const offPresence = subscribe("presence:update", ({ userId, online }) =>
      setConversations((prev) => prev.map((c) => (c.counterpart?._id === userId ? { ...c, counterpart: { ...c.counterpart, online } } : c)))
    );
    return () => { offNew(); offUpdate(); offDeleted(); offEdited(); offRead(); offRemoved(); offPresence(); };
  }, [subscribe, setSearchParams]);

  const selectConversation = useCallback(
    (id) => {
      setActiveId(id);
      setSearchParams(id ? { c: id } : {}, { replace: true });
      setPendingContext((ctx) => (ctx && ctx.conversationId === id ? ctx : null));
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!activeId || loading) return;
    if (conversations.some((c) => c._id === activeId)) return;
    let cancelled = false;
    getConversation(activeId)
      .then((res) => { if (!cancelled) setConversations((prev) => upsert(prev, res.data.conversation, true)); })
      .catch(() => { if (!cancelled) { showToast("That conversation isn't available.", "error"); selectConversation(null); } });
    return () => { cancelled = true; };
  }, [activeId, loading, conversations, showToast, selectConversation]);

  const openStarted = useCallback(
    (conversation) => {
      setConversations((prev) => upsert(prev, conversation.lastMessage ? conversation : { ...conversation, draft: true }, true));
      selectConversation(conversation._id);
    },
    [selectConversation]
  );

  useEffect(() => {
    if (startedRef.current) return;
    const sellerId = searchParams.get("seller");
    const customerId = searchParams.get("customer");
    const support = searchParams.get("support");
    if (!sellerId && !customerId && !support) return;
    startedRef.current = true;

    const productId = searchParams.get("product");
    const orderId = searchParams.get("order");

    (async () => {
      setStarting(true);
      try {
        let body;
        if (user.role === "customer") body = { type: "direct", sellerId };
        else if (user.role === "seller") body = customerId ? { type: "direct", customerId } : { type: "support" };
        else body = { type: "support", sellerId };

        const res = await startConversation(body);
        const conversation = res.data.conversation;
        openStarted(conversation);

        if (productId) {
          let ctx = { kind: "product", refId: productId, title: "Product", subtitle: "", image: "" };
          try {
            const p = (await getPublicProduct(productId)).data.product;
            ctx = { kind: "product", refId: productId, title: p.name, subtitle: `$${Number(p.price).toFixed(2)}`, image: p.images?.[0]?.url || "" };
          } catch {
            // the card still works without a thumbnail
          }
          setPendingContext({ conversationId: conversation._id, ...ctx });
        } else if (orderId) {
          setPendingContext({ conversationId: conversation._id, kind: "order", refId: orderId, title: `Order #${shortOrderId(orderId)}`, subtitle: "", image: "" });
        }
      } catch (err) {
        showToast(err.message || "Couldn't start the chat.", "error");
        setSearchParams({}, { replace: true });
      } finally {
        setStarting(false);
      }
    })();
  }, [searchParams, user.role, openStarted, showToast, setSearchParams]);

  const handleContactSupport = async () => {
    setStarting(true);
    try {
      const res = await startConversation({ type: "support" });
      openStarted(res.data.conversation);
    } catch (err) {
      showToast(err.message || "Couldn't open support chat.", "error");
    } finally {
      setStarting(false);
    }
  };

  const handleRemoved = useCallback(
    (id) => {
      setConversations((prev) => prev.filter((c) => c._id !== id));
      selectConversation(null);
    },
    [selectConversation]
  );

  const active = conversations.find((c) => c._id === activeId) || null;
  const hasMore = pagination.page < pagination.pages;

  return (
    <div className="chat-slide-up flex bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm" style={{ height: "calc(100dvh - 9.5rem)", minHeight: 480 }}>
      <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-[#E5E5E5]`}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          hasLoaded={hasLoaded}
          activeId={activeId}
          onSelect={selectConversation}
          searchInput={searchInput}
          search={search}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
          canContactSupport={user.role === "seller"}
          onContactSupport={handleContactSupport}
          contacting={starting}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => fetchList(pagination.page + 1)}
          totalUnread={totalUnread}
          emptyHint={EMPTY_HINT[user.role]}
        />
        {error && <p className="text-xs text-red-500 px-5 pb-3">{error}</p>}
      </aside>

      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
        {starting && !active && (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[#6B6B6B]"><Spinner size={16} /> Opening chat...</div>
        )}

        {active && (
          <ChatThread
            key={active._id}
            conversation={active}
            onBack={() => selectConversation(null)}
            onPatch={patchConversation}
            onRemoved={handleRemoved}
            pendingContext={pendingContext?.conversationId === active._id ? pendingContext : null}
            onClearContext={() => setPendingContext(null)}
          />
        )}

        {!active && !starting && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#FBFAF7]">
            <div className="chat-bob w-20 h-20 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm flex items-center justify-center text-4xl mb-5">💬</div>
            <p className="text-lg font-serif text-[#111111] mb-1">Your messages</p>
            <p className="text-sm text-[#6B6B6B] max-w-xs">Select a conversation to read and reply in real time.</p>
          </div>
        )}
      </section>
    </div>
  );
}