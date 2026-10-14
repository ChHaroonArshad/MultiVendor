import { useEffect, useState } from "react";
import { categories } from "../../data/marketplaceData";
import { getCategoryVisual } from "../../data/homeContent";
import { getPublicProducts } from "../../services/publicProductApi";
import { Icon, SmartImage } from "../../components/marketplace/marketplaceUi";

export function AdminCategoriesPage() {
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // limit:1 is enough, only the `total` from each response is used.
    Promise.all([
      getPublicProducts({ limit: 1 }),
      ...categories.map((c) => getPublicProducts({ category: c.id, limit: 1 })),
    ])
      .then(([all, ...perCategory]) => {
        if (cancelled) return;
        setTotal(all.data.total ?? 0);
        setCounts(Object.fromEntries(categories.map((c, i) => [c.id, perCategory[i].data.total ?? 0])));
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load category counts."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [reloadKey]);

  const counted = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const uncategorised = Math.max(0, total - counted);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Categories</h1>
        <p className="text-sm text-[#6B6B6B]">The categories sellers can choose from and shoppers can browse.</p>
      </div>

      <div className="border border-[#E5E5E5] bg-[#FAFAFA] rounded-2xl px-4 py-3 text-xs text-[#6B6B6B] leading-relaxed">
        Categories are defined in the app configuration (<code>marketplaceData.js</code>), so they can't be added,
        renamed or deleted from here yet. Doing that needs a category collection in the database. Counts below
        are <strong>published, approved</strong> products only.
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-8 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {!loading && !error && uncategorised > 0 && (
        <div role="alert" className="border border-[#C9A227]/40 bg-[#FBF6E9] rounded-2xl px-4 py-3 text-xs text-[#8a6f14]">
          {uncategorised} published {uncategorised === 1 ? "product has" : "products have"} a category that isn't in
          this list (for example an older spelling such as "electronics"). {uncategorised === 1 ? "It" : "They"} won't
          appear when shoppers browse by category. Open {uncategorised === 1 ? "it" : "them"} in the seller dashboard and
          re-select the category.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => {
          const visual = getCategoryVisual(c.name);
          return (
            <div key={c.id} className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
              <div className={`relative h-24 ${visual.tint}`}>
                <SmartImage
                  src={visual.image}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  fallback={<div className="absolute inset-0 flex items-center justify-center text-[#8A8578]"><Icon name={visual.icon} size={30} strokeWidth={1.3} /></div>}
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-[#111111]">{c.name}</p>
                <p className="text-[11px] text-[#9A968D]">Stored as “{c.id}”</p>
                <p className="text-xs text-[#6B6B6B] mt-2">
                  {loading ? "Counting..." : `${counts[c.id] ?? 0} published`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}