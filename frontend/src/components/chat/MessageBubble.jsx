import { RowActionsMenu } from "../ui/RowActionsMenu";
import { ContextCard } from "./ContextCard";
import { LinkifiedText } from "./LinkifiedText";
import { formatTime } from "../../utils/chatUtils";

function Ticks({ message }) {
  if (message.pending) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  }
  const color = message.readAt ? "#C9A227" : "#B0B0B0";
  return (
    <svg width="16" height="12" viewBox="0 0 28 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label={message.readAt ? "Seen" : "Sent"}>
      <path d="M2 13l5 5L17 6" />
      {message.readAt && <path d="M12 16l2 2L26 6" />}
    </svg>
  );
}

export function MessageBubble({ message, mine, first, last, nameLabel, viewerRole, canDelete, onDelete, onRetry, onOpenImage }) {
  const deleted = message.deleted;
  const hasImage = Boolean(message.image) && !deleted;

  const tone = deleted
    ? "bg-transparent text-[#B0B0B0] border border-dashed border-[#D9D9D9]"
    : mine
    ? "bg-[#111111] text-white"
    : "bg-white text-[#111111] border border-[#E5E5E5]";
  const corner = last ? (mine ? "rounded-br-md" : "rounded-bl-md") : "";

  return (
    <div className={`group flex ${mine ? "justify-end" : "justify-start"} ${first ? "mt-3" : "mt-0.5"} ${message.isNew ? "chat-msg-in" : ""}`}>
      <div className={`max-w-[84%] sm:max-w-[70%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
        {nameLabel && <span className="text-[11px] text-[#6B6B6B] mb-1 mx-1">{nameLabel}</span>}

        <div className="flex items-center gap-1">
          {mine && canDelete && !deleted && (
            <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <RowActionsMenu
                label="Message actions"
                items={[{ key: "delete", label: "Delete message", danger: true, onClick: () => onDelete(message) }]}
              />
            </div>
          )}

          <div className={`${tone} rounded-2xl ${corner} px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-opacity ${message.pending ? "opacity-70" : ""} ${message.failed ? "ring-1 ring-red-300" : ""}`}>
            {message.context && <ContextCard context={message.context} viewerRole={viewerRole} />}

            {hasImage && (
              <button type="button" onClick={() => onOpenImage(message.image)} className="block mb-1 -mx-1 overflow-hidden rounded-xl">
                <img src={message.image} alt="Shared" loading="lazy" className="max-h-64 w-full max-w-[260px] object-cover hover:scale-[1.02] transition-transform duration-300" />
              </button>
            )}

            {deleted ? (
              <span className="italic">This message was deleted</span>
            ) : (
              message.text && (
                <p className="whitespace-pre-wrap break-words">
                  <LinkifiedText text={message.text} linkClass={mine ? "text-[#E8CF7A]" : "text-[#8a6f14]"} />
                </p>
              )
            )}
          </div>
        </div>

        {message.failed ? (
          <button type="button" onClick={() => onRetry(message)} className="text-[11px] text-red-500 mt-1 mx-1 hover:underline">
            Failed to send · Retry
          </button>
        ) : (
          last && (
            <span className="flex items-center gap-1 text-[11px] text-[#B0B0B0] mt-1 mx-1">
              {formatTime(message.createdAt)}
              {mine && !deleted && <Ticks message={message} />}
            </span>
          )
        )}
      </div>
    </div>
  );
}