import { Avatar } from "../ui/Avatar";

export function ChatAvatar({ counterpart, size = 44, showPresence = true }) {
  const isSupport = counterpart.role === "support";
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {isSupport ? (
        <span className="w-full h-full rounded-full bg-[#C9A227] text-white flex items-center justify-center">
          <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
      ) : (
        <Avatar name={counterpart.name} src={counterpart.avatar} size={size} />
      )}
      {showPresence && counterpart.online && (
        <span className="chat-presence absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white" />
      )}
    </span>
  );
}