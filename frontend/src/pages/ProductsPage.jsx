import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { MarketplaceFooter } from "../components/marketplace/MarketplaceFooter";
import { ProductCard } from "../components/marketplace/ProductCard";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { Pagination } from "../components/ui/Pagination";
import { Icon } from "../components/marketplace/marketplaceUi";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { getPublicProducts } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";
// import { categories } from "../data/marketplaceData";
import { categories } from "../data/marketplaceData";
// import { resolveCategoryId } from "../data/homeContent";
import { resolveCategoryId } from "./homeContent";

// replace:  const category = params.get("category") || "";
const PAGE_SIZE = 20; // fixed on purpose: a URL-controlled limit would let anyone ask for the whole catalogue

const toPage = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

export function ProductsPage() {
  const guard = usePurchaseGuard();
  const [params, setParams] = useSearchParams();

  const page = toPage(params.get("page"));
  const category = resolveCategoryId(params.get("category") || "");

  const search = (params.get("search") || "").slice(0, 100);

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Single place that changes the URL. Page 1 and empty values are simply removed.
  const updateParams = (changes, { replace = false } = {}) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === "" || value == null || (key === "page" && Number(value) === 1)) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      },
      { replace }
    );
  };

  useEffect(() => { document.title = "All Products | Marketplace"; }, []);

  // Keep the input in step with the URL (back/forward buttons, shared links).
  useEffect(() => { setSearchInput(search); }, [search]);

  // Debounced search: the URL only changes 400ms after typing stops, and always resets to page 1.
  useEffect(() => {
    if (searchInput.trim() === search) return undefined;
    const timer = setTimeout(() => updateParams({ search: searchInput.trim(), page: 1 }, { replace: true }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false; // ignores answers that arrive after a newer request started
    setLoading(true);
    setError("");

    const query = { page, limit: PAGE_SIZE };
    if (category) query.category = category;
    if (search) query.search = search;

    getPublicProducts(query)
      .then((res) => {
        if (cancelled) return;
        const result = res.data;
        const pages = Math.max(1, result.pages || 1);
        if (page > pages) {
          updateParams({ page: pages }, { replace: true }); // page no longer exists after filtering
          return;
        }
        setData({
          products: result.products.map(transformProduct),
          total: result.total ?? result.products.length,
          pages,
        });
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load products."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, search, reloadKey]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, category, search]);

  const hasFilters = Boolean(category || search);
  const clearFilters = () => { setSearchInput(""); setParams({}, { replace: false }); };

  return (
    <div className="min-h-screen bg-[#FBFAF7] font-sans">
      <MarketplaceNavbar />

      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6B6B] mb-4 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#111111]">Home</Link>
          <span aria-hidden="true">›</span>
          <span className="text-[#111111]">Products</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#111111]">All Products</h1>
            <p className="text-sm text-[#6B6B6B] mt-1" aria-live="polite">
              {loading ? "Loading products..." : `${data.total} ${data.total === 1 ? "product" : "products"}`}
              {!loading && hasFilters ? " match your filters" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
            <div className="relative sm:w-72">
              <Icon name="search" size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A968D] pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                maxLength={100}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E8E5DF] bg-white text-sm placeholder:text-[#9A968D] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
              />
            </div>
            <select
              value={category}
              onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
              aria-label="Filter by category"
              className="px-4 py-2.5 rounded-full border border-[#E8E5DF] bg-white text-sm text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all sm:w-52"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div role="status" aria-busy="true" aria-label="Loading products" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#E8E5DF] bg-white overflow-hidden animate-pulse">
                <div className="aspect-square bg-[#F1EEE8]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-2.5 bg-[#EFECE6] rounded w-1/3" />
                  <div className="h-3 bg-[#EFECE6] rounded w-4/5" />
                  <div className="h-9 bg-[#F1EEE8] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 py-12 text-center px-4">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && data.products.length === 0 && (
          <div className="rounded-2xl border border-[#E8E5DF] bg-white py-16 text-center">
            <p className="text-sm text-[#6B6B6B] mb-2">
              {hasFilters ? "No products match your search or filters." : "No products are available yet."}
            </p>
            {hasFilters && <button onClick={clearFilters} className="text-xs font-medium text-[#C9A227] hover:underline">Clear filters</button>}
          </div>
        )}

        {!loading && !error && data.products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {data.products.map((p) => <ProductCard key={p.id} product={p} guard={guard.guardedAction} />)}
            </div>
            {data.pages > 1 && (
              <div className="mt-10">
                <Pagination page={page} pages={data.pages} total={data.total} limit={PAGE_SIZE} onChange={(next) => updateParams({ page: next })} />
              </div>
            )}
          </>
        )}
      </main>

      <MarketplaceFooter />
      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
      <PurchaseBlockModal message={guard.sellerMessage} role={guard.blockedRole} onClose={guard.closeSellerModal} />
    </div>
  );
}