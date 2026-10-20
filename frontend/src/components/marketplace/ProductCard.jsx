import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { Icon, SmartImage } from "./marketplaceUi";
import { getCategoryLabel, shouldContain } from "../../data/homeContent";
import { WishlistButton } from "../wishlist/WishlistButton";
export function ProductCard({ product, guard }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false); // UI-only, same as before (no wishlist backend yet)

  const handleAddToCart = (e) => {
    e.stopPropagation();
    guard(() => addItem(product, 1));
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount ? Math.round(100 - (product.price / product.originalPrice) * 100) : 0;
  const categoryLabel = getCategoryLabel(product.category);
  const contain = shouldContain(categoryLabel);
  const soldOut = product.stock === 0;
  const open = () => navigate(`/product/${product.id}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter") open(); }}
      className="group h-full flex flex-col cursor-pointer rounded-2xl overflow-hidden bg-white border border-[#E8E5DF] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/40"
    >
      <div className="relative aspect-square overflow-hidden bg-[#F6F4F0]">

        <SmartImage
          src={product.image}
          alt={product.name}
          className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${contain ? " object-contain p-4 mix-blend-multiply" : "object-cover"
            }`}
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 text-[10px] font-medium tracking-wide bg-[#C9A227] text-white px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        <WishlistButton
          product={product}
          guard={guard}
          className="absolute top-3 right-3 z-10"
        />
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#9A968D] mb-1.5">{categoryLabel}</p>
        <p title={product.name} className="text-sm font-medium text-[rgb(17,17,17)] leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </p>

        <div className="h-5 mt-1.5 flex items-center gap-1.5">
          {product.rating != null && (
            <>
              <Icon name="star" size={12} fill="#C9A227" strokeWidth={0} />
              <span className="text-xs text-[#111111]">{product.rating}</span>
              {product.reviews != null && <span className="text-[11px] text-[#9A968D]">({product.reviews})</span>}
            </>
          )}
        </div>

        <p className="mt-2 mb-3.5">
          <span className="text-base font-semibold text-[#111111]">${product.price}</span>
          {hasDiscount && <span className="text-xs text-[#9A968D] line-through ml-2">${product.originalPrice}</span>}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={soldOut}
          className="mt-auto w-full text-xs font-medium bg-[#111111] text-white py-2.5 rounded-full hover:opacity-90 transition-all duration-200 disabled:bg-[#E8E5DF] disabled:text-[#9A968D] disabled:cursor-not-allowed"
        >
          {soldOut ? "Sold out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}