import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { getPurchaseBlockMessage } from "../../utils/roleUtils";

export function ProductCard({ product, onBlocked }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (user && (user.role === "seller" || user.role === "admin")) {
      onBlocked(user.role);
      return;
    }
    addItem(product, 1);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-48 overflow-hidden bg-[#FAFAFA]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {product.badge && <span className="absolute top-3 left-3 text-[11px] tracking-wide uppercase bg-white/90 border border-[#E5E5E5] text-[#111111] px-2 py-1 rounded-full">{product.badge}</span>}
        <button onClick={(e) => e.stopPropagation()} aria-label="Add to wishlist" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-[#E5E5E5] flex items-center justify-center text-[#6B6B6B] hover:text-[#C9A227] transition-colors">♡</button>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#111111] mb-0.5 truncate">{product.name}</p>
        <p className="text-xs text-[#6B6B6B] mb-1.5">by {product.seller}</p>
        {product.rating != null && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-[#C9A227]">★ {product.rating}</span>
            {product.reviews != null && <span className="text-[11px] text-[#B0B0B0]">({product.reviews})</span>}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-semibold text-[#111111]">${product.price}</span>
            {product.originalPrice && <span className="text-xs text-[#B0B0B0] line-through ml-1.5">${product.originalPrice}</span>}
          </div>
          <button onClick={handleAddToCart} className="text-xs font-medium bg-[#111111] text-white px-3.5 py-2 rounded-full hover:opacity-90 transition-all duration-200 whitespace-nowrap">Add to cart</button>
        </div>
      </div>
    </div>
  );
}