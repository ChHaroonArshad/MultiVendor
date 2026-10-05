import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { ProductCard } from "../components/marketplace/ProductCard";
import { SellerCard } from "../components/marketplace/SellerCard";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { getPublicProducts } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";
import {
  marketplaceStats, categories, featuredProducts as dummyHeroProducts, sellers,
  whyShopWithUs, sellerJourneySteps,
} from "../data/marketplaceData";

function Hero() {
 
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 pb-16 grid lg:grid-cols-2 gap-12 items-center">
      <div className="animate-fade-slide-up">
        <span className="inline-block px-3 py-1 text-xs border border-[#E5E5E5] rounded-full text-[#6B6B6B] mb-6">A MARKETPLACE BUILT ON TRUST</span>
        <h1 className="text-4xl sm:text-5xl font-serif text-[#111111] leading-tight mb-5">
          Discover Products From Stores You Can Trust.
        </h1>
        <p className="text-[#6B6B6B] mb-8 max-w-md">
          Explore products from independent sellers, discover new brands, and find something worth bringing home.
        </p>
        <div className="flex items-center gap-4">
          <a href="#featured-products" className="bg-[#111111] text-white px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5">Shop Now</a>
          <a href="#categories" className="border border-[#E5E5E5] px-7 py-3 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-all duration-200 hover:-translate-y-0.5">Browse Categories</a>
        </div>
      </div>

      <div className="relative h-80 sm:h-96 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="absolute inset-0 grid grid-cols-2 gap-3">
          <div className="rounded-3xl overflow-hidden border border-[#E5E5E5]"><img src={dummyHeroProducts[0].image} alt="" className="w-full h-full object-cover" /></div>
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl overflow-hidden border border-[#E5E5E5] flex-1"><img src={dummyHeroProducts[5].image} alt="" className="w-full h-full object-cover" /></div>
            <div className="rounded-3xl overflow-hidden border border-[#E5E5E5] flex-1"><img src={dummyHeroProducts[2].image} alt="" className="w-full h-full object-cover" /></div>
          </div>
        </div>
        <div className="absolute -bottom-4 left-4 bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3 shadow-sm animate-float">
          <p className="text-xs font-medium text-[#111111]">★ {dummyHeroProducts[0].rating} rating</p>
          <p className="text-[11px] text-[#6B6B6B]">{dummyHeroProducts[0].name}</p>
        </div>
        <div className="absolute top-4 right-4 bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3 shadow-sm animate-float" style={{ animationDelay: "1.2s" }}>
          <p className="text-xs font-medium text-[#111111]">${dummyHeroProducts[2].price}</p>
          <p className="text-[11px] text-[#C9A227]">Free shipping</p>
        </div>
      </div>
    </section>
  );
}

function TrustStats() {
  return (
    <section className="border-y border-[#E5E5E5] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {marketplaceStats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-serif text-[#111111]">{s.value}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCategories() {
  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Shop by Category</h2>
      <p className="text-sm text-[#6B6B6B] mb-8">Explore products from categories you'll love.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <a key={cat.id} href="#featured-products" className="group block">
            <div className="rounded-2xl overflow-hidden border border-[#E5E5E5] h-28 mb-2 transition-all duration-300 group-hover:border-[#C9A227]/50">
              <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="text-sm font-medium text-[#111111] group-hover:text-[#C9A227] transition-colors">{cat.name}</p>
            <p className="text-[11px] text-[#6B6B6B]">{cat.count}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function PromotionalBanner({ bannerImage }) {
  if (!bannerImage) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="relative rounded-3xl overflow-hidden border border-[#E5E5E5] h-56 sm:h-64">
        <img src={bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-14 max-w-md">
          <h3 className="text-2xl sm:text-3xl font-serif text-white mb-2">Upgrade Your Everyday</h3>
          <p className="text-sm text-white/80 mb-5">Discover products from our growing marketplace.</p>
          <a href="#featured-products" className="bg-white text-[#111111] px-6 py-2.5 rounded-full text-sm font-medium w-fit hover:opacity-90 transition-all duration-200">Explore Products</a>
        </div>
      </div>
    </section>
  );
}

function WhyShopWithUs() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-8 text-center">Why Shop With Us</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {whyShopWithUs.map((item) => (
          <div key={item.title} className="text-center">
            <div className="w-11 h-11 mx-auto rounded-full bg-[#FBF6E9] border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] text-lg mb-3">{item.icon}</div>
            <p className="text-sm font-medium text-[#111111] mb-1">{item.title}</p>
            <p className="text-xs text-[#6B6B6B]">{item.description}</p>
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
  const subheading = user?.role === "seller"
    ? "Keep your store growing — manage products, orders, and performance in one place."
    : "Turn your products into a growing online store.";

  return (
    <section className="bg-[#111111] py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">{heading}</h2>
        <p className="text-sm text-[#B0B0B0] mb-10 max-w-lg mx-auto">{subheading}</p>

        {user?.role !== "seller" && (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {sellerJourneySteps.map((s, i) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#C9A227] text-[#111111] font-semibold text-sm flex items-center justify-center">{s.step}</div>
                  <p className="text-[11px] text-[#B0B0B0] mt-2 max-w-[90px]">{s.label}</p>
                </div>
                {i < sellerJourneySteps.length - 1 && <div className="w-8 h-px bg-[#333333] hidden sm:block" />}
              </div>
            ))}
          </div>
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
    <section className="max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center">
      <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-2">Find Something You'll Love.</h2>
      <p className="text-sm text-[#6B6B6B] mb-7">Explore products from trusted marketplace sellers.</p>
      <a href="#featured-products" className="inline-block bg-[#111111] text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5">Explore Products</a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div>
          <p className="font-serif text-lg text-[#111111] mb-3">Marketplace</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/" className="hover:text-[#111111]">Home</Link></li>
            <li><a href="#featured-products" className="hover:text-[#111111]">Products</a></li>
            <li><a href="#categories" className="hover:text-[#111111]">Categories</a></li>
            <li><a href="#sellers" className="hover:text-[#111111]">Sellers</a></li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">For Buyers</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/customer/orders" className="hover:text-[#111111]">Orders</Link></li>
            <li><Link to="/customer/wishlist" className="hover:text-[#111111]">Wishlist</Link></li>
            <li><Link to="/customer/basket" className="hover:text-[#111111]">Cart</Link></li>
            <li>Help</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">For Sellers</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li><Link to="/register" className="hover:text-[#111111]">Become a Seller</Link></li>
            <li><Link to="/seller" className="hover:text-[#111111]">Seller Dashboard</Link></li>
            <li>Seller Guide</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[#111111] mb-3">Company</p>
          <ul className="space-y-2 text-[#6B6B6B] text-xs">
            <li>About</li><li>Contact</li><li>Privacy</li><li>Terms</li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-[#B0B0B0] mt-10">© {new Date().getFullYear()} Marketplace. All rights reserved.</p>
    </footer>
  );
}

export function LandingPage() {
  const guard = usePurchaseGuard();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPublicProducts({ limit: 16 })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.products.map(transformProduct));
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const featured = products.slice(0, 8);
  const trending = products.slice(8, 14).length > 0 ? products.slice(8, 14) : products.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketplaceNavbar />

      <Hero />
      <TrustStats />
      <FeaturedCategories />

      <section id="featured-products" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Featured Products</h2>
        <p className="text-sm text-[#6B6B6B] mb-8">Explore what shoppers are loving right now.</p>

        {loading && <p className="text-sm text-[#6B6B6B]">Loading products...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && featured.length === 0 && (
          <p className="text-sm text-[#6B6B6B]">No products available yet — check back soon.</p>
        )}
        {!loading && !error && featured.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => <ProductCard key={p.id} product={p} guard={guard.guardedAction} />)}
          </div>
        )}
      </section>

      <PromotionalBanner bannerImage={featured[2]?.image} />

      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Trending Now</h2>
          <p className="text-sm text-[#6B6B6B] mb-8">What's picking up momentum across the marketplace.</p>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((p) => (
              <div key={p.id} className="w-56 shrink-0">
                <ProductCard product={p} guard={guard.guardedAction} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="sellers" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Popular Stores</h2>
        <p className="text-sm text-[#6B6B6B] mb-8">Discover independent sellers building their business here.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {sellers.map((s) => <SellerCard key={s.id} seller={s} />)}
        </div>
      </section>

      <WhyShopWithUs />
      <BecomeSeller />
      <FinalCTA />
      <Footer />

      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
      <PurchaseBlockModal message={guard.sellerMessage} role={guard.blockedRole} onClose={guard.closeSellerModal} />
    </div>
  );
}