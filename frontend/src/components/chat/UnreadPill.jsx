import { useChat } from "../../context/ChatContext";

export function UnreadPill() {
  const { totalUnread } = useChat();
  if (!totalUnread) return null;
  return (
    <span key={totalUnread} className="chat-pop ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#C9A227] text-white text-[10px] flex items-center justify-center">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}