import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { ProductCard } from "../components/marketplace/ProductCard";
import { LoginRequiredModal } from "../components/marketplace/LoginRequiredModal";
import { PurchaseBlockModal } from "../components/marketplace/PurchaseBlockModal";
import { Avatar } from "../components/ui/Avatar";
import { Pagination } from "../components/ui/Pagination";
import { Spinner } from "../components/ui/Spinner";
import { usePurchaseGuard } from "../hooks/usePurchaseGuard";
import { getPublicStore } from "../services/storeApi";
import { getPublicProducts } from "../services/publicProductApi";
import { transformProduct } from "../utils/transformProduct";

const PAGE_SIZE = 12;

export function StorePage() {
  const { id } = useParams();
  const guard = usePurchaseGuard();

  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState({ products: [], total: 0, pages: 1 });
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setStoreLoading(true);
    setNotFound(false);
    setPage(1);
    getPublicStore(id)
      .then((res) => { if (!cancelled) setStore(res.data.store); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setStoreLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (notFound) return undefined;
    let cancelled = false;
    setProductsLoading(true);
    getPublicProducts({ seller: id, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setCatalog({ products: res.data.products.map(transformProduct), total: res.data.total, pages: res.data.pages });
      })
      .catch(() => { if (!cancelled) setCatalog({ products: [], total: 0, pages: 1 }); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, [id, page, notFound]);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <MarketplaceNavbar />
        <div className="py-24 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading store...</p>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <MarketplaceNavbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-lg font-serif text-[#111111] mb-2">Store not found</p>
          <Link to="/" className="text-sm text-[#C9A227] hover:underline">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const memberSince = new Date(store.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketplaceNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 animate-fade-slide-up">
        <div className="border border-[#E5E5E5] rounded-3xl overflow-hidden bg-white mb-10">
          {store.banner ? (
            <img src={store.banner} alt="" className="w-full h-40 sm:h-52 object-cover" />
          ) : (
            <div className="h-40 sm:h-52 bg-gradient-to-br from-[#FBF6E9] to-[#F0F0F0]" />
          )}
          <div className="px-6 sm:px-8 pb-6">
            <div className="-mt-10 mb-4 w-20 h-20 rounded-full border-4 border-white shadow overflow-hidden bg-white">
              <Avatar name={store.storeName} src={store.logo} size={72} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#111111]">{store.storeName}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[#6B6B6B]">
              {store.category && <span className="text-[#C9A227]">{store.category}</span>}
              <span>{store.productCount} product{store.productCount === 1 ? "" : "s"}</span>
              <span>Selling since {memberSince}</span>
              {store.contactEmail && (
                <a href={`mailto:${store.contactEmail}`} className="hover:text-[#111111] underline underline-offset-2">{store.contactEmail}</a>
              )}
            </div>
            {store.description && <p className="text-sm text-[#6B6B6B] mt-4 max-w-2xl leading-relaxed">{store.description}</p>}
          </div>
        </div>

        <h2 className="text-xl font-serif text-[#111111] mb-6">Products</h2>

        {productsLoading && (
          <div className="py-12 flex items-center justify-center gap-2">
            <Spinner size={16} className="text-[#6B6B6B]" />
            <p className="text-sm text-[#6B6B6B]">Loading products...</p>
          </div>
        )}

        {!productsLoading && catalog.products.length === 0 && (
          <div className="border border-[#E5E5E5] rounded-2xl bg-white py-14 text-center">
            <p className="text-sm text-[#6B6B6B]">This store has no products for sale right now.</p>
          </div>
        )}

        {!productsLoading && catalog.products.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {catalog.products.map((p) => <ProductCard key={p.id} product={p} guard={guard.guardedAction} />)}
            </div>
            <Pagination page={page} pages={catalog.pages} total={catalog.total} limit={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>

      <LoginRequiredModal open={guard.guestModalOpen} onClose={guard.closeGuestModal} />
      <PurchaseBlockModal role={guard.blockedRole} message={guard.sellerMessage} onClose={guard.closeSellerModal} />
    </div>
  );
}