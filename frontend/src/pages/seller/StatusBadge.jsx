const STYLES = {
  published: "bg-emerald-50 text-emerald-700",
  pending: "bg-[#FBF6E9] text-[#8a6f14]",
  rejected: "bg-red-50 text-red-600",
  draft: "bg-[#F3F3F3] text-[#6B6B6B]",
  "out-of-stock": "bg-red-50 text-red-600",
  "in-stock": "bg-emerald-50 text-emerald-700",
  "low-stock": "bg-[#FBF6E9] text-[#8a6f14]",
  pending_order: "bg-[#F3F3F3] text-[#6B6B6B]",
  processing: "bg-blue-50 text-blue-600",
  shipped: "bg-[#FBF6E9] text-[#8a6f14]",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

const LABELS = { "out-of-stock": "Out of Stock", "low-stock": "Low Stock", "in-stock": "In Stock" };

export function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.draft;
  return <span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${style}`}>{LABELS[status] || status}</span>;
}