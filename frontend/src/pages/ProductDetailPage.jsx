import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { MarketplaceFooter } from "../components/marketplace/MarketplaceFooter";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { ProductCard } from "../components/marketplace/ProductCard";
import { Icon, SmartImage } from "../components/marketplace/marketplaceUi";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { useCart } from "../hooks/useCart";
import { getPublicProduct, getPublicProducts } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";
import { recordRecentlyViewed } from "../utils/recentlyViewed";
import { formatPrice } from "../utils/formatPrice";
import { getCategoryLabel } from "../data/homeContent";
import { ReportButton } from "../components/reports/ReportButton";


const container = "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10";
const DESCRIPTION_PREVIEW_LENGTH = 180;
const LOW_STOCK_THRESHOLD = 5;
const TABS = [
  { key: "details", label: "DETAILS" },
  { key: "delivery", label: "DELIVERY" },
  { key: "returns", label: "RETURNS" },
];

// Scrollable but with no visible scrollbar in any browser.
const HIDE_SCROLLBAR = "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function FieldLabel({ children }) {
  return <p className="text-[10px] tracking-[0.2em] text-[#8A919B] font-medium mb-2.5">{children}</p>;
}

function StockNotice({ tone, title, text }) {
  const styles = tone === "red" ? "border-red-200 bg-red-50 text-red-600" : "border-[#C9A227]/40 bg-[#FBF6E9] text-[#8a6f14]";
  return (
    <div className={`mb-4 px-4 py-3 rounded-lg border ${styles}`} role="status">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs opacity-80 mt-0.5">{text}</p>
    </div>
  );
}

/* ------------------------------- Gallery ------------------------------- */

function Gallery({ images, name }) {
  const reduceMotion = usePrefersReducedMotion();
  const behavior = reduceMotion ? "auto" : "smooth";

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [broken, setBroken] = useState({});
  const [canScroll, setCanScroll] = useState({ up: false, down: false });
  const railRef = useRef(null);
  const thumbRefs = useRef([]);
  const total = images.length;

  const go = (dir) => setIndex((i) => (i + dir + total) % total);

  const handleKeyDown = (e) => {
    if (total < 2) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  };

  // Keeps the up/down rail buttons in step with the real scroll position.
  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const up = rail.scrollTop > 2;
    const down = rail.scrollTop + rail.clientHeight < rail.scrollHeight - 2;
    setCanScroll((s) => (s.up === up && s.down === down ? s : { up, down }));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    observer?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      observer?.disconnect();
    };
  }, [updateScrollState, total]);

  // Scroll the rail (not the page) just enough to keep the active thumbnail visible.
  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRefs.current[index];
    if (!rail || !thumb) return;

    const vertical = rail.scrollHeight > rail.clientHeight + 1; // desktop/tablet rail; false for the mobile strip
    if (vertical) {
      const top = thumb.offsetTop;
      const bottom = top + thumb.offsetHeight;
      if (top < rail.scrollTop) rail.scrollTo({ top: Math.max(0, top - 8), behavior });
      else if (bottom > rail.scrollTop + rail.clientHeight) rail.scrollTo({ top: bottom - rail.clientHeight + 8, behavior });
    } else {
      const left = thumb.offsetLeft;
      const right = left + thumb.offsetWidth;
      if (left < rail.scrollLeft) rail.scrollTo({ left: Math.max(0, left - 8), behavior });
      else if (right > rail.scrollLeft + rail.clientWidth) rail.scrollTo({ left: right - rail.clientWidth + 8, behavior });
    }
  }, [index, behavior]);

  const scrollRail = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const first = thumbRefs.current[0];
    const step = first ? (first.offsetHeight + 8) * 2 : rail.clientHeight * 0.8; // two thumbnails (8px gap)
    rail.scrollBy({ top: dir * step, behavior });
  };

  const railBtn =
    "hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E3E5E8] shadow-sm items-center justify-center text-[#1F2328] hover:scale-105 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892]";
  const mainBtn =
    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E3E5E8] shadow-sm flex items-center justify-center text-[#1F2328] hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892]";

  return (
    <div
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name} images`}
      onKeyDown={handleKeyDown}
      className="flex flex-col md:flex-row gap-2.5 md:gap-3 md:h-[min(68svh,560px)] lg:h-[var(--gallery-h)] lg:sticky lg:top-[var(--sticky-top)] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892]/60"
    >
      {/* Thumbnail rail: vertical on tablet/desktop, horizontal strip on phones */}
      {total > 1 && (
        <div className="relative order-2 md:order-1 shrink-0 md:w-[84px] xl:w-[108px] md:h-full min-w-0">
          <div
            ref={railRef}
            role="group"
            aria-label="Product image thumbnails"
            className={`relative flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto md:h-full md:pb-12 ${HIDE_SCROLLBAR}`}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                ref={(el) => { thumbRefs.current[i] = el; }}
                onClick={() => setIndex(i)}
                aria-label={`View image ${i + 1} of ${total}`}
                aria-current={i === index}
                className={`shrink-0 w-16 h-20 md:w-full md:h-auto md:aspect-[3/4] overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892] ${i === index ? "border-[#1F2328]" : "border-transparent hover:border-[#C9CED6]"
                  }`}
              >
                <SmartImage src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <button onClick={() => scrollRail(-1)} disabled={!canScroll.up} aria-label="Scroll thumbnails up" className={`${railBtn} top-2`}>
            <Icon name="arrowUp" size={15} />
          </button>
          <button onClick={() => scrollRail(1)} disabled={!canScroll.down} aria-label="Scroll thumbnails down" className={`${railBtn} bottom-2`}>
            <Icon name="arrowUp" size={15} className="rotate-180" />
          </button>
        </div>
      )}

      {/* Main image */}
      <div className="relative order-1 md:order-2 flex-1 min-w-0 h-[min(78vw,480px)] md:h-full rounded-xl overflow-hidden bg-[#F5F4F1] border border-[#ECEAE6]">
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
          {total === 0 || broken[index] ? (
            <div className="flex flex-col items-center gap-2 text-[#9AA0A8]">
              <Icon name="bag" size={44} strokeWidth={1.2} />
              <p className="text-sm">{total === 0 ? "No image available" : "Image unavailable"}</p>
            </div>
          ) : (
            <>
              {!loaded[index] && <div aria-hidden="true" className="absolute inset-4 rounded-lg bg-white/60 animate-pulse" />}
              <img
                key={index}
                src={images[index]}
                alt={`${name} (image ${index + 1} of ${total})`}
                onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
                onError={() => setBroken((b) => ({ ...b, [index]: true }))}
                className={`w-full h-full object-cover mix-blend-multiply transition-opacity duration-300 ${loaded[index] ? "opacity-100" : "opacity-0"}`}
              />
            </>
          )}
        </div>

        {total > 1 && (
          <>
            {/* <button onClick={() => go(-1)} aria-label="Previous image" className={`${mainBtn} left-3`}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <button onClick={() => go(1)} aria-label="Next image" className={`${mainBtn} right-3`}>
              <Icon name="chevronRight" size={18} />
            </button> */}
          </>
        )}
        <p className="sr-only" aria-live="polite">{total > 0 ? `Image ${index + 1} of ${total}` : ""}</p>
      </div>
    </div>
  );
}

/* ------------------------------ Supporting ------------------------------ */

function ProductSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading product" className={`${container} py-6 lg:py-8 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 lg:gap-14 animate-pulse`}>
      <div className="h-[min(78vw,480px)] md:h-[min(68svh,560px)] lg:h-[var(--gallery-h)] rounded-xl bg-[#F1F0ED]" />
      <div className="space-y-4 pt-2">
        <div className="h-3 bg-[#EEF1F5] rounded w-1/3" />
        <div className="h-8 bg-[#EEF1F5] rounded w-3/4" />
        <div className="h-3 bg-[#EEF1F5] rounded w-1/4" />
        <div className="h-10 bg-[#EEF1F5] rounded w-1/3 mt-6" />
        <div className="h-3 bg-[#EEF1F5] rounded w-full mt-6" />
        <div className="h-3 bg-[#EEF1F5] rounded w-5/6" />
        <div className="h-12 bg-[#EEF1F5] rounded mt-8" />
      </div>
    </div>
  );
}

function RelatedProducts({ product, guard }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!product.category) return undefined;
    let cancelled = false;
    getPublicProducts({ category: product.category, limit: 5 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.products.map(transformProduct).filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [product.id, product.category]);

  if (items.length === 0) return null;

  return (
    <section className={`${container} py-14`}>
      <div className="flex items-end justify-between gap-4 mb-7">
        <h2 className="font-serif text-2xl sm:text-3xl text-[#111111]">More in {getCategoryLabel(product.category)}</h2>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="inline-flex items-center gap-1.5 text-sm text-[#111111] hover:gap-2.5 transition-all">
          View all <Icon name="arrowRight" size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {items.map((p) => <ProductCard key={p.id} product={p} guard={guard} />)}
      </div>
    </section>
  );
}

/* --------------------------------- Page --------------------------------- */

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const guard = usePurchaseGuard();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [tab, setTab] = useState("details");
  const [wishlisted, setWishlisted] = useState(false); // UI-only until a wishlist backend exists

  const alreadyInCart = items.find((i) => i.id === id)?.qty || 0;
  const remainingStock = product ? Math.max(0, product.stock - alreadyInCart) : 0;
  const atLimit = remainingStock > 0 && qty >= remainingStock;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setQty(1);
    setDescExpanded(false);
    getPublicProduct(id)
      .then((res) => {
        if (cancelled) return;
        const p = transformProduct(res.data.product);
        setProduct(p);
        recordRecentlyViewed(p);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (remainingStock > 0 && qty > remainingStock) setQty(remainingStock);
  }, [remainingStock, qty]);

  useEffect(() => {
    if (product) document.title = `${product.name} | Marketplace`;
  }, [product]);

  // --nav-h must match the navbar height (h-16 = 4rem in MarketplaceNavbar).
  // --gallery-h = viewport height minus navbar and breathing room, kept between 420px and 700px.
  const shell = (children) => (
    <div
      className="min-h-screen bg-white font-sans text-[#1F2328]"
      style={{
        "--nav-h": "4rem",
        "--sticky-top": "calc(var(--nav-h) + 1.5rem)",
        "--gallery-h": "clamp(420px, calc(100svh - var(--nav-h) - 4rem), 700px)",
      }}
    >
      <MarketplaceNavbar />
      {children}
      <MarketplaceFooter />
    </div>
  );

  if (loading) return shell(<ProductSkeleton />);

  if (notFound || !product) {
    return shell(
      <div className="max-w-md mx-auto px-4 py-28 text-center">
        <p className="text-2xl font-serif mb-2">Product unavailable</p>
        <p className="text-sm text-[#777777] mb-6">The product you're looking for could not be found.</p>
        <Link to="/products" className="inline-block bg-[#1F2328] text-white px-7 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-all">
          Back to Products
        </Link>
      </div>
    );
  }

  const images = (product.gallery || []).filter(Boolean);
  const description = product.description || "";
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription = descExpanded || !isLongDescription ? description : description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "...";
  const specEntries = Object.entries(product.specifications || {});
  const itemCode = product.sku || String(product.id).slice(-6).toUpperCase();
  const categoryLabel = getCategoryLabel(product.category);

  // A discount is shown only when the original price is genuinely higher than the current one.
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount ? Math.round(100 - (product.price / product.originalPrice) * 100) : 0;

  const canBuy = product.stock > 0 && remainingStock > 0;
  const showLowStock = canBuy && product.stock <= LOW_STOCK_THRESHOLD;

  const handleAddToCart = () => guard.guardedAction(() => addItem(product, qty));

  // Wait for the server-side cart to save before opening checkout.
  const handleBuyNow = () =>
    guard.guardedAction(async () => {
      try {
        await addItem(product, qty);
        navigate("/checkout");
      } catch {
        // the cart context already reports the failure
      }
    });

  return shell(
    <>
      <main className={`${container} py-6 lg:py-8 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-start animate-fade-slide-up`}>
        <Gallery key={product.id} images={images} name={product.name} />

        <section className="min-w-0 lg:pt-1">
          <nav aria-label="Breadcrumb" className="text-xs text-[#8A919B] mb-4 flex items-center gap-1.5 min-w-0">
            <Link to="/" className="hover:text-[#1F2328] shrink-0">Home</Link>
            <span aria-hidden="true">›</span>
            {product.category && (
              <>
                <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[#1F2328] shrink-0">{categoryLabel}</Link>
                <span aria-hidden="true">›</span>
              </>
            )}
            <span className="text-[#1F2328] truncate">{product.name}</span>
          </nav>

          <h1 className="font-serif text-[1.75rem] sm:text-[2rem] leading-snug text-[#1F2328] break-words">{product.name}</h1>
          <p className="text-sm text-[#5F6670] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-xs text-[#6B6B6B] mb-3">
              By{" "}
              {product.sellerId ? (
                <Link
                  to={`/store/${product.sellerId}`}
                  className="text-[#111111] font-medium hover:text-[#C9A227] transition-colors"
                >
                  {product.seller}
                </Link>
              ) : (
                <span className="text-[#111111] font-medium">
                  {product.seller}
                </span>
              )}
            </p>
            {product.rating != null && (
              <span className="inline-flex items-center gap-1">
                <Icon name="star" size={13} fill="#C9A227" strokeWidth={0} />
                {product.rating}
                {product.reviews != null && <span className="text-[#8A919B]">({product.reviews})</span>}
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-5 mb-5">
            <span className="text-3xl sm:text-4xl font-medium text-[#1F2328]">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-[#9AA0A8] line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-xs font-semibold text-[#8a6f14] bg-[#FBF6E9] border border-[#C9A227]/30 rounded-full px-2.5 py-1">-{discount}%</span>
              </>
            )}
          </div>

          {description && (
            <div className="mb-6">
              <p className="text-sm text-[#4B5260] leading-relaxed max-w-prose">{visibleDescription}</p>
              {isLongDescription && (
                <button onClick={() => setDescExpanded((v) => !v)} aria-expanded={descExpanded} className="text-xs font-medium text-[#1F2328] underline underline-offset-2 mt-2">
                  {descExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {product.stock === 0 && (
            <StockNotice tone="red" title="Out of Stock" text="This product is currently unavailable from the seller." />
          )}
          {product.stock > 0 && remainingStock === 0 && (
            <StockNotice
              tone="amber"
              title="All available stock is in your cart"
              text={`Only ${product.stock} unit${product.stock > 1 ? "s" : ""} of this product exist, and you already have all of them in your cart.`}
            />
          )}

          {canBuy ? (
            <>
              <div className="flex gap-2.5">
                <div className="flex items-center border border-[#D9DDE2] rounded-md h-12 shrink-0">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-10 h-full text-base disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                  <span className="w-8 text-center text-sm font-medium" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(remainingStock, q + 1))} disabled={atLimit} aria-label="Increase quantity" className="w-10 h-full text-base disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 h-12 rounded-md bg-[#C9D4C8] text-[#1F2A22] text-sm font-medium hover:bg-[#B9C8B8] transition-colors duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892]">
                  Add to Cart
                </button>
              </div>

              <div className="mt-2.5 space-y-1 empty:hidden">
                {atLimit && (
                  <p className="text-xs text-[#8a6f14]">
                    You've reached the maximum, only {remainingStock} more available
                    {alreadyInCart > 0 ? ` (you already have ${alreadyInCart} in your cart)` : ""}.
                  </p>
                )}
                {!atLimit && alreadyInCart > 0 && <p className="text-xs text-[#777777]">{alreadyInCart} already in your cart.</p>}
                {showLowStock && <p className="text-xs text-[#C0392B]">Only {product.stock} left in stock.</p>}
              </div>
            </>
          ) : (
            <button disabled className="w-full h-12 rounded-md bg-[#ECEEF0] text-[#9AA0A8] text-sm font-medium cursor-not-allowed">
              {product.stock === 0 ? "Out of Stock" : "Already in Your Cart"}
            </button>
          )}

          <button
            onClick={() => guard.guardedAction(() => setWishlisted((v) => !v))}
            aria-pressed={wishlisted}
            className="mt-2.5 w-full h-12 rounded-md border border-[#C9CED6] bg-white text-sm font-medium text-[#1F2328] hover:border-[#1F2328] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#73A892]"
          >
            {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
            <Icon name="heart" size={17} fill={wishlisted ? "#E8A88D" : "none"} className={wishlisted ? "text-[#E8A88D]" : "text-[#9AA0A8]"} />
          </button>

          {canBuy && (
            <button onClick={handleBuyNow} className="mt-4 text-xs font-medium text-[#1F2328] underline underline-offset-4 hover:text-[#5E8F7B] transition-colors">
              Buy now →
            </button>
          )}

          <div className="mt-8 border-t border-[#1F2328]/80">
            <div role="tablist" className="grid grid-cols-3">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`py-3.5 text-[11px] tracking-[0.2em] font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? "border-[#1F2328] text-[#1F2328]" : "border-transparent text-[#8A919B] hover:text-[#1F2328]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="border-t border-[#E3E5E8]" />

            <div role="tabpanel" key={tab} className="pt-5 text-sm text-[#4B5260] animate-fade-slide-up">
              {tab === "details" && (
                <dl className="space-y-2.5">
                  {[["Seller", product.seller], ["Category", categoryLabel], ["Item code", itemCode], ...specEntries]
                    .filter(([, value]) => value)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-6 text-xs">
                        <dt className="text-[#8A919B]">{key}</dt>
                        <dd className="text-[#1F2328] font-medium text-right break-words min-w-0">{String(value)}</dd>
                      </div>
                    ))}
                </dl>
              )}
              {tab === "delivery" && (
                <p className="leading-relaxed">
                  This item ships directly from {product.seller}. After you pay, you can follow every update
                  (processing, shipped, delivered) in My Orders. The price shown is the price you pay at
                  checkout; no shipping fee or tax is added.
                </p>
              )}
              {tab === "returns" && (
                <p className="leading-relaxed">
                  If a seller cancels a paid order, the full amount is refunded to your original payment
                  method. A formal returns policy has not been published yet.
                </p>
              )}
            </div>
          </div>
             <div className="mt-5 pt-4 border-t border-[#E5E5E5]">
            <ReportButton
              targetType="product"
              targetId={product.id}
              targetName={product.name}
              ownerId={product.sellerId}
            />
          </div>
        </section>
      </main>

      <RelatedProducts product={product} guard={guard.guardedAction} />

      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
      <PurchaseBlockModal role={guard.blockedRole} message={guard.sellerMessage} onClose={guard.closeSellerModal} />
    </>
  );
}