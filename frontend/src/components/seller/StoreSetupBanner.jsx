import { Link } from "react-router-dom";
import { useSellerStore } from "../../hooks/useSellerStore";

export function StoreSetupBanner() {
  const { status, completion } = useSellerStore();
 if (status !== "ready" || !completion || completion.complete) return null;

  const missing = completion.items.filter((item) => !item.done).map((item) => item.label.toLowerCase());

  return (
    <div className="mb-6 rounded-2xl border border-[#C9A227]/40 bg-[#FBF6E9] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-slide-up">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#111111]">Finish setting up your store to add products</p>
        <p className="text-xs text-[#6B6B6B] mt-0.5">Still needed: {missing.join(", ")}.</p>
      </div>
      <Link to="/seller/store" className="text-xs font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full text-center hover:opacity-90 transition-all shrink-0">
        Complete store
      </Link>
    </div>
  );
}