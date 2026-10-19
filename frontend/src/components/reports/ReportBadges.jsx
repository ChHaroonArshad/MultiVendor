import { FlagIcon } from "../icons/FlagIcon";

const STATUS_STYLES = {
  open: "bg-[#FDF3E3] text-[#B98900]",
  reviewing: "bg-[#EAF1FB] text-[#2A5DB0]",
  resolved: "bg-[#EAF7ED] text-[#2E7D32]",
  dismissed: "bg-[#F0F0F0] text-[#6B6B6B]",
};
const STATUS_LABELS = { open: "Open", reviewing: "In review", resolved: "Resolved", dismissed: "Dismissed" };
const TYPE_LABELS = { product: "Product", store: "Store", support: "Support" };

export function ReportStatusBadge({ status }) {
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.dismissed}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function ReportTypeBadge({ type }) {
  const isSupport = type === "support";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${isSupport ? "bg-[#F3F3F3] text-[#6B6B6B]" : "bg-red-50 text-red-500"}`}>
      {isSupport ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ) : (
        <FlagIcon size={11} />
      )}
      {TYPE_LABELS[type] || type}
    </span>
  );
}