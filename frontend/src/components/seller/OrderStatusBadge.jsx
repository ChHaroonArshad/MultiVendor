const STYLES = {
  // order status
  pending: "bg-[#F0F0F0] text-[#6B6B6B]",
  processing: "bg-[#FDF3E3] text-[#B98900]",
  shipped: "bg-[#EAF1FB] text-[#2A5DB0]",
  delivered: "bg-[#EAF7ED] text-[#2E7D32]",
  cancelled: "bg-[#FBEAEA] text-[#C0392B]",
  // payment status
  paid: "bg-[#EAF7ED] text-[#2E7D32]",
  refunded: "bg-[#F3EAFB] text-[#7B3FA8]",
  unpaid: "bg-[#F0F0F0] text-[#6B6B6B]",
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${STYLES[status] || "bg-[#F0F0F0] text-[#6B6B6B]"}`}>
      {status}
    </span>
  );
}