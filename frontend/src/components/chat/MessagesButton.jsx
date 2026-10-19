import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
// import { useChat } from "../../context/ChatContext";
import { useChat } from "../../context/ChatContext"

const PATHS = { customer: "/customer/messages", seller: "/seller/messages", admin: "/admin/messages" };

export function MessagesButton() {
  const { user } = useAuth();
  const { totalUnread } = useChat();
  const navigate = useNavigate();

  if (!user || !PATHS[user.role]) return null;

  return (
    <button
      onClick={() => navigate(PATHS[user.role])}
      aria-label={`Messages${totalUnread ? `, ${totalUnread} unread` : ""}`}
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {totalUnread > 0 && (
        <span key={totalUnread} className="chat-pop absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </button>
  );
}