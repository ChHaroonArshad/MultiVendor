import { Link } from "react-router-dom";

const ORDER_PATH = { customer: "/customer/orders", seller: "/seller/orders" };

export function ContextCard({ context, viewerRole }) {
  const to = context.kind === "product" ? `/product/${context.refId}` : `${ORDER_PATH[viewerRole] || "/"}/${context.refId}`;
  return (
    <Link to={to} className="flex items-center gap-2.5 bg-white text-[#111111] border border-[#E5E5E5] rounded-xl p-2 mb-2 hover:border-[#C9A227]/60 transition-colors">
      {context.image ? (
        <img src={context.image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 bg-[#FAFAFA]" />
      ) : (
        <span className="w-11 h-11 rounded-lg bg-[#FBF6E9] flex items-center justify-center text-lg shrink-0">{context.kind === "order" ? "📦" : "🛍️"}</span>
      )}
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-[#B0B0B0]">{context.kind === "order" ? "Order" : "Product"}</span>
        <span className="block text-xs font-medium truncate max-w-[200px]">{context.title}</span>
        {context.subtitle && <span className="block text-[11px] text-[#6B6B6B] capitalize">{context.subtitle}</span>}
      </span>
    </Link>
  );
}