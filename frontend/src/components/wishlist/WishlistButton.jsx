import { useWishlist } from "../../hooks/useWishlist";
import { HeartIcon } from "./HeartIcon";

export function WishlistButton({ product, guard, variant = "icon", className = "" }) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);
  const run = guard || ((action) => action());

  const handleClick = (e) => {
    e.preventDefault(); // the card around the heart is usually a link
    e.stopPropagation();
    run(() => toggle(product));
  };

  const heart = (
    <span key={saved ? "on" : "off"} className={`inline-flex ${saved ? "heart-pop" : ""}`}>
      <HeartIcon size={variant === "full" ? 17 : 16} filled={saved} className={saved ? "text-[#E0627A]" : "text-[#9AA0A8]"} />
    </span>
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={`w-full h-12 rounded-md border border-[#C9CED6] bg-white text-sm font-medium text-[#1F2328] hover:border-[#1F2328] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892] ${className}`}
      >
        {saved ? "Saved to Wishlist" : "Add to Wishlist"}
        {heart}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${className}`}
    >
      {heart}
    </button>
  );
}