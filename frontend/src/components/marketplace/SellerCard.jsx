import { Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";

export function SellerCard({ store }) {
  const cover = store.banner || store.logo;

  return (
    <Link
      to={`/store/${store._id}`}
      className="group block border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="h-32 overflow-hidden bg-[#F0F0F0]">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FBF6E9] to-[#F0F0F0]" />
        )}
      </div>
      <div className="p-4 flex items-center gap-3">
        <Avatar name={store.storeName} src={store.logo} size={40} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#111111] truncate">{store.storeName}</p>
          <p className="text-xs text-[#6B6B6B] truncate">{store.category || "Marketplace seller"}</p>
        </div>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between text-xs text-[#6B6B6B]">
        <span>{store.productCount} product{store.productCount === 1 ? "" : "s"}</span>
        <span className="text-[#C9A227] group-hover:underline">Visit store →</span>
      </div>
    </Link>
  );
}