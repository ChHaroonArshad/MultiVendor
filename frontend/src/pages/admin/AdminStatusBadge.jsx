const STYLES = {
  active: "bg-[#EAF7ED] text-[#2E7D32]",
  approved: "bg-[#EAF7ED] text-[#2E7D32]",
  published: "bg-[#EAF7ED] text-[#2E7D32]",
  paid: "bg-[#EAF7ED] text-[#2E7D32]",
  delivered: "bg-[#EAF7ED] text-[#2E7D32]",

  pending: "bg-[#FDF3E3] text-[#B98900]",
  draft: "bg-[#F0F0F0] text-[#6B6B6B]",

  shipped: "bg-[#EAF1FB] text-[#2A5DB0]",

  suspended: "bg-[#FBEAEA] text-[#C0392B]",
  rejected: "bg-[#FBEAEA] text-[#C0392B]",
  cancelled: "bg-[#FBEAEA] text-[#C0392B]",
};

export function AdminStatusBadge({ status }) {
  const style = STYLES[status] || "bg-[#F0F0F0] text-[#6B6B6B]";
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}