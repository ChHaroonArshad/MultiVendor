const STYLES = {
  customer: "bg-[#F0F0F0] text-[#6B6B6B]",
  seller: "bg-[#EAF1FB] text-[#2A5DB0]",
  admin: "bg-[#FBF6E9] text-[#8a6f14]",
};

export function RoleBadge({ role }) {
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${STYLES[role] || STYLES.customer}`}>
      {role}
    </span>
  );
}