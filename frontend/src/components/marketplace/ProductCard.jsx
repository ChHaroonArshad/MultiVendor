import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export function ProductCard({ product, guard }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    guard(() => addItem(product, 1));
  };

  const discount = product.originalPrice ? Math.round(100 - (product.price / product.originalPrice) * 100) : null;

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-48 overflow-hidden bg-[#FAFAFA]">
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && <span className="text-[10px] tracking-wide uppercase bg-white/90 border border-[#E5E5E5] text-[#111111] px-2 py-1 rounded-full w-fit">{product.badge}</span>}
          {discount && <span className="text-[10px] tracking-wide uppercase bg-[#C9A227] text-white px-2 py-1 rounded-full w-fit">-{discount}%</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setWishlisted((v) => !v); }}
          aria-label="Toggle wishlist"
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-[#E5E5E5] flex items-center justify-center text-sm transition-colors ${wishlisted ? "text-[#C9A227]" : "text-[#6B6B6B]"}`}
        >
          {wishlisted ? "♥" : "♡"}
        </button>
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wide text-[#B0B0B0] mb-1">{product.category}</p>
        <p className="text-sm font-medium text-[#111111] mb-0.5 truncate">{product.name}</p>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-[#C9A227]">★ {product.rating}</span>
          {product.reviews && <span className="text-[11px] text-[#B0B0B0]">({product.reviews})</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-semibold text-[#111111]">${product.price}</span>
            {product.originalPrice && <span className="text-xs text-[#B0B0B0] line-through ml-1.5">${product.originalPrice}</span>}
          </div>
          <button onClick={handleAddToCart} className="text-xs font-medium bg-[#111111] text-white px-3.5 py-2 rounded-full hover:opacity-90 transition-all duration-200 whitespace-nowrap">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}