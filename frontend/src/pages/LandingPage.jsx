import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { ProductCard } from "../components/marketplace/ProductCard";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { BrandMark, Icon, SmartImage } from "../components/marketplace/marketplaceUi";
import { getPublicProducts } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";
import { getRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";
// import { categories } from "../data/marketplaceData";
import { categories, sellerJourneySteps } from "../data/marketplaceData";
import {
  HERO_SLIDES, BANNER_IMAGE, WHY_ITEMS, getCategoryVisual, getCategoryLabel,
} from "../data/homeContent";
import { MarketplaceFooter } from "../components/marketplace/MarketplaceFooter";
import { getPublicStores } from "../services/storeApi";
import { SellerCard } from "../components/marketplace/SellerCard";
import { SiteFooter } from "../components/marketplace/SiteFooter";

const container = "max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12";
const sectionY = "py-12 lg:py-14";
const sectionTitle = "font-serif text-2xl sm:text-[2rem] leading-tight text-[#111111]";
const discountPct = (p) => Math.round(100 - (p.price / p.originalPrice) * 100);




// -------------------------- Hero ---------------------------------- */

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

function HeroSlider() {
  const reduceMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState([]); // slides whose image could not load are skipped
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = HERO_SLIDES.filter((s) => !failed.includes(s.id));
  const count = slides.length;
  const current = count ? ((active % count) + count) % count : 0;

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return undefined;
    const timer = setInterval(() => setActive((i) => i + 1), 4500);
    return () => clearInterval(timer); // cleaned up on unmount and whenever it pauses
  }, [count, paused, reduceMotion]);

  const markFailed = (id) => setFailed((f) => (f.includes(id) ? f : [...f, id]));
  const arrow =
    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-[#111111] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-105 transition-all duration-200";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="group relative aspect-[4/3] sm:aspect-[3/2] rounded-[1.75rem] overflow-hidden bg-[#EFEBE4] border border-[#E8E5DF]">
        {count === 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-px bg-[#E8E5DF]">
            {["smartphone", "shirt", "home", "shoe"].map((icon) => (
              <div key={icon} className="bg-[#F6F3EE] flex items-center justify-center text-[#A8A396]">
                <Icon name={icon} size={44} strokeWidth={1.2} />
              </div>
            ))}
          </div>
        ) : (
          slides.map((s, i) => (
            <img
              key={s.id}
              src={s.image}
              alt={s.alt}
              aria-hidden={i !== current}
              loading={i === 0 ? "eager" : "lazy"}
              onError={() => markFailed(s.id)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === current ? "opacity-100" : "opacity-0"
                }`}
            />
          ))
        )}

        {count > 0 && <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />}

        {count > 0 && (
          <Link
            to={slides[current].to}
            className="absolute bottom-5 left-5 inline-flex items-center gap-2 bg-white/95 backdrop-blur rounded-full pl-4 pr-3 py-2 text-xs font-medium text-[#111111] hover:gap-3 transition-all"
          >
            {slides[current].label} <Icon name="arrowRight" size={13} />
          </Link>
        )}

        {count > 1 && (
          <>
            <button onClick={() => setActive(current - 1)} aria-label="Previous slide" className={`${arrow} left-4`}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <button onClick={() => setActive(current + 1)} aria-label="Next slide" className={`${arrow} right-4`}>
              <Icon name="chevronRight" size={18} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#6B6B6B] tabular-nums">
            {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                aria-label={`Show ${s.label}`}
                aria-current={i === current}
                className="py-2"
              >
                <span className={`block h-[3px] rounded-full transition-all duration-500 ${i === current ? "w-10 bg-[#111111]" : "w-5 bg-[#D5D1C8] hover:bg-[#A8A396]"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Hero({ catalogTotal }) {
  // Only real numbers: product count from the API, category count from the app's own list.
  const stats = [
    catalogTotal != null && { value: catalogTotal, label: "Products live" },
    { value: categories.length, label: "Categories" },
    { value: "Approved", label: "Every seller is reviewed" },
  ].filter(Boolean);

  return (
    <section className={`${container} pt-8 lg:pt-12 pb-6`}>
      <div className="grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-10 xl:gap-16 items-center">
        <div className="animate-fade-slide-up">
          <p className="text-[11px] tracking-[0.22em] text-[#8A8578] font-medium mb-5">
            DISCOVER SOMETHING EXTRAORDINARY
          </p>
          <h1 className="font-serif text-[2.5rem] sm:text-5xl xl:text-[3.6rem] leading-[1.08] text-[#111111] mb-5 text-balance">
            Everything You Need. <span className="text-[#C9A227]">All in One Place.</span>
          </h1>
          <p className="text-[#6B6B6B] leading-relaxed mb-8 max-w-md">
            Explore electronics, fashion, home essentials, and everyday discoveries from independent sellers you can trust.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <a href="#featured-products" className="inline-flex items-center gap-2 bg-[#111111] text-white px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5">
              Shop Now <Icon name="arrowRight" size={15} />
            </a>
            <a href="#categories" className="border border-[#D9D5CC] px-7 py-3 rounded-full text-sm font-medium text-[#111111] hover:border-[#111111] transition-all duration-200 hover:-translate-y-0.5">
              Explore Categories
            </a>
          </div>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-6 border-t border-[#E8E5DF] max-w-md">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-serif text-2xl text-[#111111] leading-none">{s.value}</dd>
                <p className="text-[11px] text-[#6B6B6B] mt-1.5 max-w-[110px] leading-snug">{s.label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
          <HeroSlider />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Categories ------------------------------- */

function FeaturedCategories() {
  return (
    <section id="categories" className={`${container} ${sectionY} scroll-mt-24`}>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h2 className={sectionTitle}>Shop by Category</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">Explore collections for every part of your life.</p>
        </div>
        <Link to="/categories" className="inline-flex items-center gap-1.5 text-sm text-[#111111] hover:gap-2.5 transition-all shrink-0">
          View All Categories <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.slice(0, 6).map((cat) => {
          const visual = getCategoryVisual(cat.name);
          return (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.id)}`}
              className="group block focus-visible:outline-none"
            >
              <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5DF] mb-3 transition-all duration-300 group-hover:border-[#111111]/30 group-focus-visible:ring-2 group-focus-visible:ring-[#C9A227]/40 ${visual.tint}`}>
                <SmartImage
                  src={visual.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center text-[#8A8578] transition-transform duration-500 group-hover:scale-110">
                      <Icon name={visual.icon} size={36} strokeWidth={1.3} />
                    </div>
                  }
                />
              </div>
              <p className="text-sm font-medium text-[#111111]">{cat.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------- Products -------------------------------- */

function ProductSkeletons({ count = 5 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E8E5DF] bg-white overflow-hidden animate-pulse">
          <div className="aspect-square bg-[#F1EEE8]" />
          <div className="p-4 space-y-2.5">
            <div className="h-2.5 bg-[#EFECE6] rounded w-1/3" />
            <div className="h-3 bg-[#EFECE6] rounded w-4/5" />
            <div className="h-4 bg-[#EFECE6] rounded w-1/4" />
            <div className="h-9 bg-[#F1EEE8] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-[#E8E5DF] rounded-full px-3 py-1.5 text-[#111111]">
      <span className="text-[#9A968D]">{label}:</span> {value}
    </span>
  );
}

function PromotionalBanner({ deals }) {
  // Everything shown here is real: discounts are computed from products that have an original price.
  const maxDiscount = deals.length ? Math.max(...deals.map(discountPct)) : 0;

  return (
    <section className={`${container} ${sectionY}`}>
      <div className="relative rounded-3xl overflow-hidden border border-[#E8E5DF] bg-[#24211D]">
        <SmartImage
          src={BANNER_IMAGE}
          alt="Everyday products from our marketplace"
          className="absolute inset-0 w-full h-full object-cover"
          fallback={<div className="absolute inset-0 bg-[#24211D]" />}
        />
        <div className="absolute inset-0 bg-[#111111]/50" />

        <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-8 items-center p-8 sm:p-12 min-h-[260px]">
          <div>
            {maxDiscount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-[#C9A227] text-[#111111] text-[11px] font-semibold tracking-wide rounded-full px-3 py-1 mb-4">
                <Icon name="tag" size={12} /> UP TO {maxDiscount}% OFF
              </span>
            )}
            <h3 className="font-serif text-3xl sm:text-4xl text-white mb-2">Upgrade Your Everyday</h3>
            <p className="text-sm text-white/80 mb-6 max-w-sm">Discover thoughtful finds from trusted marketplace sellers.</p>
            <a href="#featured-products" className="bg-white text-[#111111] px-6 py-2.5 rounded-full text-sm font-medium w-fit inline-block hover:opacity-90 transition-all duration-200">
              Explore Products
            </a>
          </div>

          {deals.length > 0 && (
            <div className="hidden md:flex justify-end gap-3">
              {deals.slice(0, 3).map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="w-36 bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                  <div className="aspect-square bg-[#F6F4F0]">
                    <SmartImage src={p.image} alt={p.name} className="w-full h-full object-contain p-3 mix-blend-multiply" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#111111] truncate">{p.name}</p>
                    <p className="text-xs mt-0.5">
                      <span className="font-semibold text-[#111111]">${p.price}</span>
                      <span className="text-[#C9A227] ml-1.5">-{discountPct(p)}%</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrendingRow({ products, guard }) {
  const scrollerRef = useRef(null);
  const scroll = (dir) => scrollerRef.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  return (
    <section className={`${container} ${sectionY}`}>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h2 className={sectionTitle}>Trending Now</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">See what shoppers are discovering across the marketplace.</p>
        </div>
        <div className="hidden sm:flex gap-2">
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              aria-label={dir < 0 ? "Scroll left" : "Scroll right"}
              className="w-9 h-9 rounded-full border border-[#E8E5DF] bg-white flex items-center justify-center text-[#111111] hover:border-[#111111] transition-colors"
            >
              <Icon name={dir < 0 ? "chevronLeft" : "chevronRight"} size={16} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0 snap-start">
            <ProductCard product={p} guard={guard} />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentlyViewed() {
  const [items, setItems] = useState([]);
  useEffect(() => { setItems(getRecentlyViewed().slice(0, 6)); }, []);

  if (items.length === 0) return null;

  return (
    <section className={`${container} pb-4`}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="font-serif text-xl text-[#111111]">Pick up where you left off</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Products you looked at recently.</p>
        </div>
        <button
          onClick={() => { clearRecentlyViewed(); setItems([]); }}
          className="text-xs text-[#6B6B6B] hover:text-[#111111] underline underline-offset-2"
        >
          Clear
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-[#E8E5DF] bg-white p-3 hover:shadow-sm transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[#F6F4F0] overflow-hidden shrink-0">
              <SmartImage src={p.image} alt={p.name} className="w-full h-full object-contain p-1.5 mix-blend-multiply" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#111111] truncate">{p.name}</p>
              <p className="text-xs text-[#6B6B6B]">${p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------- Stores --------------------------------- */

function topCategoryOf(items) {
  const counts = new Map();
  for (const p of items) {
    const label = getCategoryLabel(p.category);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}


function PopularStores({ stores, onView }) {
  if (!stores.length) return null;

  return (
    <section
      id="sellers"
      className="max-w-7xl mx-auto px-4 sm:px-8 py-16"
    >
      <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">
        Popular Stores
      </h2>

      <p className="text-sm text-[#6B6B6B] mb-8">
        Discover independent sellers building their business here.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stores.map((store) => (
          <SellerCard key={store._id} store={store} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------- Why / Seller CTA / Footer ------------------------ */

function WhyShopWithUs() {
  return (
    <section className={`${container} ${sectionY}`}>
      <h2 className={`${sectionTitle} mb-9 text-center`}>Why Shop With Us</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {WHY_ITEMS.map((item) => (
          <div key={item.title} className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FBF6E9] border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227] mb-4">
              <Icon name={item.icon} size={20} />
            </div>
            <p className="text-sm font-medium text-[#111111] mb-1">{item.title}</p>
            <p className="text-xs text-[#6B6B6B] max-w-[200px] mx-auto leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BecomeSeller() {
  const { user } = useAuth();
  const cta = !user
    ? { label: "Become a Seller", to: "/register" }
    : user.role === "seller"
      ? { label: "Manage Your Store", to: "/seller" }
      : { label: "Become a Seller", to: "/register" };

  const heading = user?.role === "seller" ? "Manage Your Store" : "Have Something to Sell?";
  const subheading =
    user?.role === "seller"
      ? "Keep your store growing, manage products, orders, and performance in one place."
      : "Turn your products into a growing online store.";

  return (
    <section className="bg-[#111111] py-14 sm:py-16">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-3">{heading}</h2>
        <p className="text-sm text-[#B0B0B0] mb-10 max-w-lg mx-auto">{subheading}</p>

        {user?.role !== "seller" && (
          <ol className="flex mb-10">
            {sellerJourneySteps.map((s, i) => (
              <li key={s.step} className="relative flex-1 min-w-0 px-1">
                {i < sellerJourneySteps.length - 1 && (
                  <span aria-hidden="true" className="absolute top-[18px] left-1/2 w-full h-px bg-white/15" />
                )}
                <div className="relative flex flex-col items-center">
                  <span className="w-9 h-9 rounded-full bg-[#C9A227] text-[#111111] font-semibold text-sm flex items-center justify-center">
                    {s.step}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#B0B0B0] mt-3 max-w-[96px] leading-snug break-words">
                    {s.label}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}

        <Link to={cta.to} className="inline-block bg-[#C9A227] text-[#111111] px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5">
          {cta.label}
        </Link>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center">
      <h2 className={`${sectionTitle} mb-2`}>Find Something You'll Love.</h2>
      <p className="text-sm text-[#6B6B6B] mb-7">Explore products from trusted marketplace sellers.</p>
      <a href="#featured-products" className="inline-block bg-[#111111] text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5">
        Explore Products
      </a>
    </section>
  );
}



function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-[#111111] text-white shadow-lg flex items-center justify-center hover:-translate-y-0.5 transition-all duration-200"
    >
      <Icon name="arrowUp" size={18} />
    </button>
  );
}

/* ----------------------------------- Page ---------------------------------- */

export function LandingPage() {
  const guard = usePurchaseGuard();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("search") || "";

  const [catalog, setCatalog] = useState([]); // unfiltered: feeds hero stats, banner, trending and stores
  const [catalogTotal, setCatalogTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [filtered, setFiltered] = useState(null); // null = no category/search filter active
  const [filterLoading, setFilterLoading] = useState(false);
  const [sellerFilter, setSellerFilter] = useState(null);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPublicStores({ limit: 4 })
      .then((res) => { if (!cancelled) setStores(res.data.stores); })
      .catch(() => { }); // the section simply stays hidden
    return () => { cancelled = true; };
  }, []);



  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPublicProducts({ limit: 16 })
      .then((res) => {
        if (cancelled) return;
        setCatalog(res.data.products.map(transformProduct));
        setCatalogTotal(res.data.total ?? null);
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load products."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    if (!category && !search) {
      setFiltered(null);
      return undefined;
    }
    let cancelled = false;
    setFilterLoading(true);
    const query = { limit: 16 };
    if (category) query.category = category;
    if (search) query.search = search;
    getPublicProducts(query)
      .then((res) => { if (!cancelled) setFiltered(res.data.products.map(transformProduct)); })
      .catch(() => { if (!cancelled) setFiltered([]); })
      .finally(() => { if (!cancelled) setFilterLoading(false); });
    return () => { cancelled = true; };
  }, [category, search, reloadKey]);

  // React Router does not scroll to #hash links by itself.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash, location.search]);

  const base = filtered ?? catalog;
  const shown = (sellerFilter ? base.filter((p) => p.seller === sellerFilter) : base).slice(0, 10);
  const featuredLoading = loading || filterLoading;
  const hasFilter = Boolean(category || search || sellerFilter);

  // Real discounts only: products that actually carry a higher original price.
  const deals = useMemo(() => catalog.filter((p) => p.originalPrice && p.originalPrice > p.price), [catalog]);

  const trending = catalog.slice(10, 16).length > 0 ? catalog.slice(10, 16) : catalog.slice(0, 6);


  const handleViewStore = (name) => {
    setSellerFilter(name);
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setSellerFilter(null);
    navigate("/#featured-products");
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <MarketplaceNavbar />

      <Hero catalogTotal={catalogTotal} />
      <FeaturedCategories />

      <section id="featured-products" className={`${container} ${sectionY} scroll-mt-24`}>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className={sectionTitle}>Featured Products</h2>
            <p className="text-sm text-[#6B6B6B] mt-1">Discover products worth adding to your everyday.</p>
          </div>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-[#111111] hover:gap-2.5 transition-all shrink-0">
            View All Products <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        {hasFilter && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {category && <FilterChip label="Category" value={getCategoryLabel(category)} />}
            {search && <FilterChip label="Search" value={`“${search}”`} />}
            {sellerFilter && <FilterChip label="Store" value={sellerFilter} />}
          </div>
        )}

        {featuredLoading && <ProductSkeletons />}

        {!featuredLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center px-4">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {!featuredLoading && !error && shown.length === 0 && (
          <div className="rounded-2xl border border-[#E8E5DF] bg-white py-14 text-center">
            <p className="text-sm text-[#6B6B6B] mb-2">
              {hasFilter ? "No products match your selection." : "No products available yet. Check back soon."}
            </p>
            {hasFilter && <button onClick={clearFilters} className="text-xs font-medium text-[#C9A227] hover:underline">View all products</button>}
          </div>
        )}

        {!featuredLoading && !error && shown.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {shown.map((p, i) => (
              <div key={p.id} className={`h-full ${i >= 8 ? "hidden xl:block" : i >= 6 ? "hidden lg:block" : ""}`}>
                <ProductCard product={p} guard={guard.guardedAction} />
              </div>
            ))}
          </div>
        )}
      </section>

      <PromotionalBanner deals={deals} />

      {trending.length > 0 && <TrendingRow products={trending} guard={guard.guardedAction} />}
      <RecentlyViewed />

      <PopularStores stores={stores} onView={handleViewStore} />
      <WhyShopWithUs />
      <BecomeSeller />
      <FinalCTA />
      {/* <MarketplaceFooter /> */}
      <SiteFooter />
      <BackToTop />

      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
      <PurchaseBlockModal message={guard.sellerMessage} role={guard.blockedRole} onClose={guard.closeSellerModal} />
    </div>
  );
}