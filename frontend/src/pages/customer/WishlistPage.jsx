// frontend/src/pages/customer/WishlistPage.jsx
import { useMemo, useState } from "react";
import { ProductCard, EmptyState } from "./CustomerDashboard";
import { mockWishlist } from "../../data/customerMockData";

const SORTS = [{ key: "recent", label: "Recently added" }, { key: "price-low", label: "Price: low to high" }, { key: "price-high", label: "Price: high to low" }];

export function WishlistPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");

  const items = useMemo(() => {
    let list = mockWishlist.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [query, sort]);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Wishlist</h1>
      <p className="text-sm text-[#6B6B6B] mb-6">{mockWishlist.length} saved items</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your wishlist..." className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all">
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty" description="Save products you love and find them here later." actionLabel="Explore Marketplace" actionTo="/" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}