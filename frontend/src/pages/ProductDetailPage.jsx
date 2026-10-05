import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { useCart } from "../hooks/useCart";
import { getPublicProduct } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";
import { categories } from "../data/marketplaceData";

const DESCRIPTION_PREVIEW_LENGTH = 140;

function ThumbnailRail({ images, activeIndex, onSelect }) {
  if (images.length <= 1) return null;
  return (
    <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[520px] lg:pr-1 shrink-0">
      {images.map((src, i) => (
        <button
          key={src + i}
          onClick={() => onSelect(i)}
          aria-label={`View image ${i + 1}`}
          className={`w-16 h-16 lg:w-20 lg:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-colors duration-200 ${
            activeIndex === i ? "border-[#C9A227]" : "border-[#E5E5E5] hover:border-[#C9A227]/50"
          }`}
        >
          <img src={src} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const guard = usePurchaseGuard();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [openSection, setOpenSection] = useState("specifications");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setActiveIndex(0);
    getPublicProduct(id)
      .then((res) => { if (!cancelled) setProduct(transformProduct(res.data.product)); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <MarketplaceNavbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center text-sm text-[#6B6B6B]">Loading product...</div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <MarketplaceNavbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-lg font-serif text-[#111111] mb-2">Product not found</p>
          <Link to="/" className="text-sm text-[#C9A227] hover:underline">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const categoryLabel = categories.find((c) => c.id === product.category)?.name || product.category;
  const isLongDescription = product.description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription = descExpanded || !isLongDescription
    ? product.description
    : product.description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "...";
  const specEntries = Object.entries(product.specifications || {});

  const handleAddToCart = () => guard.guardedAction(() => addItem(product, qty));
  const handleBuyNow = () => guard.guardedAction(() => { addItem(product, qty); navigate("/checkout"); });

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketplaceNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 animate-fade-slide-up">
        <nav className="text-xs text-[#6B6B6B] mb-6 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#111111] transition-colors">Marketplace</Link>
          <span>›</span>
          <span className="hover:text-[#111111] transition-colors">{categoryLabel}</span>
          <span>›</span>
          <span className="text-[#111111] truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[auto_1fr_400px] gap-6">
          <ThumbnailRail images={product.gallery} activeIndex={activeIndex} onSelect={setActiveIndex} />

          <div className="rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white aspect-square lg:aspect-auto lg:h-[520px]">
            {product.gallery[activeIndex] ? (
              <img
                key={activeIndex}
                src={product.gallery[activeIndex]}
                alt={`${product.name} — view ${activeIndex + 1}`}
                className="w-full h-full object-cover animate-fade-slide-up"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-[#B0B0B0]">No image available</div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-serif text-[#111111] mb-2 leading-snug">{product.name}</h1>
            <p className="text-xs text-[#6B6B6B] mb-3">By <span className="text-[#111111] font-medium">{product.seller}</span></p>

            {product.rating != null && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-[#C9A227]">★ {product.rating}</span>
                {product.reviews != null && <span className="text-[11px] text-[#B0B0B0]">({product.reviews} reviews)</span>}
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-semibold text-[#111111]">${product.price}</span>
              {product.originalPrice && <span className="text-sm text-[#B0B0B0] line-through">${product.originalPrice}</span>}
            </div>

            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-1">{visibleDescription}</p>
            {isLongDescription && (
              <button onClick={() => setDescExpanded((v) => !v)} className="text-xs font-medium text-[#111111] underline underline-offset-2 mb-6">
                {descExpanded ? "Show less" : "Read More"}
              </button>
            )}
            {!isLongDescription && <div className="mb-6" />}

            {product.stock === 0 ? (
              <p className="text-sm text-red-600 font-medium mb-5">Out of stock</p>
            ) : (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-[#6B6B6B]">Quantity</span>
                <div className="flex items-center gap-3 border border-[#E5E5E5] rounded-full px-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 text-base text-[#111111]">−</button>
                  <span className="text-sm w-5 text-center">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="w-8 h-8 text-base text-[#111111]">+</button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={() => guard.guardedAction(() => {})}
                className="w-full border border-[#E5E5E5] text-[#111111] py-3 rounded-full text-sm font-medium hover:border-[#C9A227]/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Add to Wishlist <span>♡</span>
              </button>
            </div>

            {product.stock > 0 && (
              <button onClick={handleBuyNow} className="w-full text-xs font-medium text-[#C9A227] hover:underline mb-6">
                Buy Now →
              </button>
            )}

            {specEntries.length > 0 && (
              <div className="border-t border-[#E5E5E5]">
                <button
                  onClick={() => setOpenSection(openSection === "specifications" ? null : "specifications")}
                  className="w-full flex items-center justify-between py-3.5 text-left"
                >
                  <span className="text-sm font-medium text-[#111111]">Specifications</span>
                  <span className={`text-[#6B6B6B] transition-transform duration-200 ${openSection === "specifications" ? "rotate-180" : ""}`}>⌄</span>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${openSection === "specifications" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <dl className="pb-4 space-y-2">
                      {specEntries.map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <dt className="text-[#6B6B6B]">{key}</dt>
                          <dd className="text-[#111111] font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
                <div className="border-t border-[#E5E5E5]" />
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
     <PurchaseBlockModal role={guard.blockedRole} message={guard.sellerMessage} onClose={guard.closeSellerModal} />
    </div>
  );
}