import { useEffect, useRef } from "react";
import { ChatAvatar } from "./ChatAvatar";
import { Spinner } from "../ui/Spinner";
import { formatListTime } from "../../utils/chatUtils";

function previewOf(conversation) {
  const last = conversation.lastMessage;
  if (!last) return "No messages yet. Say hello 👋";
  const prefix = last.isMine ? "You: " : "";
  if (last.deleted) return `${prefix}Message deleted`;
  if (last.type === "image") return `${prefix}📷 ${last.text || "Photo"}`;
  return `${prefix}${last.text}`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="chat-skeleton w-[46px] h-[46px] rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="chat-skeleton h-3 w-1/2 rounded-full" />
        <div className="chat-skeleton h-3 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

export function ConversationList({
  conversations, loading, hasLoaded, activeId, onSelect, searchInput, onSearchChange, onClearSearch, search,
  canContactSupport, onContactSupport, contacting, hasMore, loadingMore, onLoadMore, totalUnread, emptyHint,
}) {
  const listRef = useRef(null);

  // a new search starts from the top instead of keeping a random old scroll position
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [search]);

  const firstLoad = loading && !hasLoaded;
  const refreshing = loading && hasLoaded;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-xl font-serif text-[#111111] flex items-center gap-2">
            Messages
            {totalUnread > 0 && <span key={totalUnread} className="chat-pop text-[11px] font-sans bg-[#C9A227] text-white rounded-full px-2 py-0.5">{totalUnread}</span>}
          </h2>
          {canContactSupport && (
            <button onClick={onContactSupport} disabled={contacting} className="text-xs font-medium border border-[#E5E5E5] rounded-full px-3.5 py-1.5 hover:border-[#C9A227]/60 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {contacting && <Spinner size={11} />}
              Contact support
            </button>
          )}
        </div>

        <div className="relative">
          <input
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Search by name..."
            className="w-full pl-4 pr-16 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] focus:bg-white transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {refreshing && <Spinner size={12} className="text-[#B0B0B0]" />}
            {searchInput && <button onClick={onClearSearch} aria-label="Clear search" className="text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>}
          </span>
        </div>
      </div>

      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto chat-scroll px-2 pb-3 transition-opacity duration-200 ${refreshing ? "opacity-60" : "opacity-100"}`}
        style={{ overflowAnchor: "none" }}
      >
        {firstLoad && [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}

        {hasLoaded && conversations.length === 0 && !loading && (
          <div className="text-center px-6 py-14">
            <div className={`text-4xl mb-3 ${search ? "" : "chat-bob"}`}>{search ? "🔍" : "💬"}</div>
            <p className="text-sm font-medium text-[#111111] mb-1">{search ? "No conversations found" : "No conversations yet"}</p>
            <p className="text-xs text-[#6B6B6B]">{search ? "Try a different name." : emptyHint}</p>
          </div>
        )}

        {conversations.map((c, i) => {
          const active = c._id === activeId;
          return (
            <button
              key={c._id}
              onClick={() => onSelect(c._id)}
              className={`${hasLoaded && !search ? "" : "chat-slide-up"} w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors duration-200 ${active ? "bg-[#FBF6E9] shadow-sm" : "hover:bg-[#FAFAFA]"}`}
              style={!hasLoaded ? { animationDelay: `${Math.min(i, 8) * 35}ms` } : undefined}
            >
              <ChatAvatar counterpart={c.counterpart} size={46} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate text-[#111111] ${c.unread ? "font-semibold" : "font-medium"}`}>{c.counterpart.name}</span>
                  <span className="text-[11px] text-[#B0B0B0] shrink-0">{c.lastMessageAt ? formatListTime(c.lastMessageAt) : ""}</span>
                </span>
                <span className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={`text-xs truncate ${c.unread ? "text-[#111111]" : "text-[#6B6B6B]"}`}>{previewOf(c)}</span>
                  {c.unread > 0 && (
                    <span key={c.unread} className="chat-pop shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#C9A227] text-white text-[10px] font-medium flex items-center justify-center">
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}

        {hasMore && (
          <button onClick={onLoadMore} disabled={loadingMore} className="w-full text-xs text-[#C9A227] hover:underline py-3 flex items-center justify-center gap-2">
            {loadingMore && <Spinner size={12} />}
            Load more
          </button>
        )}
      </div>
    </div>
  );
}