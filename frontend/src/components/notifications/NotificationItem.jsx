import { timeAgo } from "../../utils/notificationUtils";

const TONES = {
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-500",
  blue: "bg-blue-50 text-blue-600",
  gold: "bg-[#FBF6E9] text-[#C9A227]",
};

const TYPE_STYLE = {
  order_new: { icon: "package", tone: "gold" },
  order_shipped: { icon: "package", tone: "blue" },
  order_delivered: { icon: "package", tone: "green" },
  order_cancelled: { icon: "package", tone: "red" },
  product_approved: { icon: "tag", tone: "green" },
  product_rejected: { icon: "tag", tone: "red" },
  product_submitted: { icon: "tag", tone: "gold" },
  seller_registered: { icon: "user", tone: "gold" },
  seller_application_submitted: { icon: "user", tone: "gold" },
  seller_application_approved: { icon: "shield", tone: "green" },
  seller_application_rejected: { icon: "shield", tone: "red" },
  account_reactivated: { icon: "shield", tone: "green" },
report_submitted: { icon: "flag", tone: "red" },
report_resolved: { icon: "flag", tone: "green" },
};

const ICON_PATHS = {
  package: (
    <>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
    
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  user: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  flag: (
  <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </>
),
};

function TypeIcon({ type }) {
  const style = TYPE_STYLE[type] || { icon: "shield", tone: "gold" };
  return (
    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TONES[style.tone]}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICON_PATHS[style.icon]}
      </svg>
    </span>
  );
}

export function NotificationItem({ notification, onOpen, onDelete }) {
  const unread = !notification.readAt;

  return (
    <div className={`group relative flex items-start gap-2 px-4 py-3 transition-colors hover:bg-[#FAFAFA] ${unread ? "bg-[#FBF6E9]/50" : "bg-white"}`}>
      <button type="button" onClick={() => onOpen(notification)} className="flex-1 min-w-0 flex items-start gap-3 text-left">
        <TypeIcon type={notification.type} />
        <span className="min-w-0 block">
          <span className={`block text-sm truncate ${unread ? "font-medium text-[#111111]" : "text-[#111111]"}`}>{notification.title}</span>
          <span className="block text-xs text-[#6B6B6B] mt-0.5 line-clamp-2">{notification.message}</span>
          <span className="block text-[11px] text-[#B0B0B0] mt-1">{timeAgo(notification.createdAt)}</span>
        </span>
      </button>

      {unread && <span className="mt-3 w-2 h-2 rounded-full bg-[#C9A227] shrink-0" role="img" aria-label="Unread" />}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(notification)}
          aria-label="Delete notification"
          className="w-6 h-6 rounded-full shrink-0 text-xs text-[#B0B0B0] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[#F0F0F0] hover:text-red-500 transition-all"
        >
          ✕
        </button>
      )}
    </div>
  );
}