import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";
import { getWishlist, clearWishlist } from "../../services/wishlistApi";
import { useWishlist } from "../../hooks/useWishlist";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../context/ToastContext";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmActionModal } from "../../components/ui/ConfirmActionModal";
import { Spinner } from "../../components/ui/Spinner";
import { HeartIcon } from "../../components/wishlist/HeartIcon";
import { formatPrice } from "../../utils/formatPrice";

const LIMIT = 12;
const SORTS = [
  { value: "recent", label: "Recently added" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name (A to Z)" },
];

function WishlistCard({ item, onRemove, onAddToCart, busy }) {
  const canBuy = item.available && item.stock > 0;
  const discount = item.originalPrice && item.originalPrice > item.price ? Math.round(100 - (item.price / item.originalPrice) * 100) : 0;

  return (
    <div className={`group rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${busy ? "opacity-60" : ""}`}>
      <div className="relative aspect-square bg-[#F6F4F0]">
        <Link to={`/product/${item.id}`} className="block w-full h-full">
          {item.image ? (
            <img src={item.image} alt={item.name} loading="lazy" className={`w-full h-full object-cover ${canBuy ? "" : "grayscale opacity-70"}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#B0B0B0]">No image</div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => onRemove(item)}
          disabled={busy}
          aria-label={`Remove ${item.name} from wishlist`}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
        >
          <HeartIcon size={16} filled className="text-[#E0627A]" />
        </button>
        {discount > 0 && canBuy && (
          <span className="absolute top-3 left-3 text-[11px] font-semibold text-[#8a6f14] bg-[#FBF6E9] border border-[#C9A227]/30 rounded-full px-2.5 py-0.5">-{discount}%</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/product/${item.id}`} className="text-sm font-medium text-[#111111] line-clamp-2 hover:text-[#C9A227] transition-colors">{item.name}</Link>
        <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{item.seller}</p>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-semibold text-[#111111]">{formatPrice(item.price)}</span>
          {item.originalPrice && item.originalPrice > item.price && <span className="text-xs text-[#B0B0B0] line-through">{formatPrice(item.originalPrice)}</span>}
        </div>

        <div className="mt-1.5 min-h-4 text-[11px]">
          {!item.available ? <span className="text-red-500">No longer available</span>
            : item.stock === 0 ? <span className="text-red-500">Out of stock</span>
            : item.stock <= 5 ? <span className="text-[#C0392B]">Only {item.stock} left</span> : null}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(item)}
          disabled={!canBuy || busy}
          className="mt-3 w-full text-xs font-medium bg-[#111111] text-white py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canBuy ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

export function WishlistPage() {
  const { count, remove, refresh } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [busyId, setBusyId] = useState(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const requestIdRef = useRef(0);

  const fetchPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getWishlist({ page, limit: LIMIT, search, sort });
      if (requestId !== requestIdRef.current) return; // a newer request started, ignore this one
      if (res.data.items.length === 0 && page > 1) {
        setPage(res.data.pagination.pages);
        return;
      }
      setItems(res.data.items);
      setPagination(res.data.pagination);
      setHasLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load your wishlist.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const applySearch = useMemo(() => debounce((value) => { setSearch(value); setPage(1); }, 400), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    applySearch(e.target.value);
  };

  const clearSearch = () => {
    applySearch.cancel();
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleRemove = async (item) => {
    setBusyId(item.id);
    await remove(item); // optimistic in the context; it reports its own errors
    await fetchPage();
    setBusyId(null);
  };

  const handleAddToCart = async (item) => {
    setBusyId(item.id);
    try {
      await addItem(item, 1); // the cart context shows its own toast
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearWishlist();
      await refresh();
      showToast("Wishlist cleared");
      setClearOpen(false);
      clearSearch();
      setPage(1);
      await fetchPage();
    } catch (err) {
      showToast(err.message || "Could not clear your wishlist.", "error");
    } finally {
      setClearing(false);
    }
  };

  const isEmptyList = hasLoaded && !error && items.length === 0 && !search;
  const noMatches = hasLoaded && !error && items.length === 0 && !!search;

  return (
    <div className="animate-fade-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Wishlist</h1>
          <p className="text-sm text-[#6B6B6B]">{count} saved {count === 1 ? "item" : "items"}</p>
        </div>
        {count > 0 && (
          <button onClick={() => setClearOpen(true)} className="text-xs text-[#6B6B6B] hover:text-red-500 transition-colors self-start sm:self-auto">Clear all</button>
        )}
      </div>

      {(count > 0 || search) && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search your wishlist..."
              className="w-full pl-4 pr-9 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
            />
            {searchInput && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>
            )}
          </div>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort wishlist" className="px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {loading && !hasLoaded && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading your wishlist...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchPage} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try again</button>
        </div>
      )}

      {isEmptyList && (
        <div className="border border-dashed border-[#E5E5E5] rounded-2xl bg-white py-16 text-center">
          <span className="w-14 h-14 mx-auto rounded-full bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center mb-4"><HeartIcon size={24} /></span>
          <p className="text-sm font-medium text-[#111111] mb-1">Your wishlist is empty</p>
          <p className="text-xs text-[#6B6B6B] mb-5">Tap the heart on any product to save it here for later.</p>
          <Link to="/products" className="text-xs font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all">Explore products</Link>
        </div>
      )}

      {noMatches && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-14 text-center">
          <p className="text-sm text-[#6B6B6B] mb-2">No saved items match "{search}".</p>
          <button onClick={clearSearch} className="text-xs font-medium text-[#C9A227] hover:underline">Clear search</button>
        </div>
      )}

      {hasLoaded && !error && items.length > 0 && (
        <div className="space-y-6">
          <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {items.map((item) => (
              <WishlistCard key={item.id} item={item} busy={busyId === item.id} onRemove={handleRemove} onAddToCart={handleAddToCart} />
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} />
        </div>
      )}

      <ConfirmActionModal
        open={clearOpen}
        danger
        title="Clear your wishlist?"
        message="Every saved item will be removed. This can't be undone."
        confirmLabel="Clear all"
        loading={clearing}
        onConfirm={handleClearAll}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}