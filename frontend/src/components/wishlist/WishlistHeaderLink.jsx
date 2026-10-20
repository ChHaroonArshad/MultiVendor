import { Link } from "react-router-dom";
import { useWishlist } from "../../hooks/useWishlist";
import { HeartIcon } from "./HeartIcon";

export function WishlistHeaderLink() {
  const { count } = useWishlist();
  return (
    <Link
      to="/customer/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} saved` : "Wishlist"}
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
    >
      <HeartIcon size={18} />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] bg-[#C9A227] text-white rounded-full flex items-center justify-center animate-badge-pop">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}