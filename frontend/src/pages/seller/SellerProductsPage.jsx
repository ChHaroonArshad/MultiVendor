import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../pages/seller/StatusBadge";
import { getMyProducts, deleteProduct, togglePublishProduct } from "../../services/productApi";
import { ConfirmDeleteModal } from "../../components/seller/ConfirmDeleteModal";
import { ProductActionsMenu } from "../../components/seller/ProductActionsMenu";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";

const FILTERS = ["All", "Published", "Pending", "Draft", "Rejected", "Out-of-stock"];

function computeDisplayStatus(p) {
  if (p.stock === 0) return "out-of-stock";
  if (p.approvalStatus === "pending") return "pending";
  if (p.approvalStatus === "rejected") return "rejected";
  return p.isPublished ? "published" : "draft";
}

export function SellerProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const lastToastKeyRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyProducts();
      setProducts(res.data.products);
    } catch (err) {
      setError(err?.message || "Failed to load your products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, location.key]);

  useEffect(() => {
    if (location.state?.justAdded && lastToastKeyRef.current !== location.key) {
      lastToastKeyRef.current = location.key;
      showToast(`"${location.state.justAdded}" submitted — pending admin approval`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.key, location.pathname, navigate, showToast]);

  const displayProducts = useMemo(() => {
    return products.map((p) => ({
      id: p._id,
      name: p.name,
      image: p.images?.[0]?.url || "",
      category: p.category,
      price: p.price,
      stock: p.stock,
      approvalStatus: p.approvalStatus,
      isPublished: p.isPublished,
      rejectionReason: p.rejectionReason,
      displayStatus: computeDisplayStatus(p),
      sales: 0,
    }));
  }, [products]);

  const filtered = useMemo(() => {
    return displayProducts.filter((p) => {
      const matchesFilter = filter === "All" || p.displayStatus === filter.toLowerCase().replace(" ", "-");
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [displayProducts, filter, query]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      showToast(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err?.message || "Failed to delete product.", "error");
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (product) => {
    setOpenMenuId(null);
    setPublishingId(product.id);
    try {
      const nextState = !product.isPublished;
      const res = await togglePublishProduct(product.id, nextState);
      setProducts((prev) => prev.map((p) => (p._id === product.id ? res.data.product : p)));
      showToast(nextState ? `"${product.name}" is now published` : `"${product.name}" unpublished`);
    } catch (err) {
      showToast(err?.message || "Failed to update publish status.", "error");
    } finally {
      setPublishingId(null);
    }
  };

  const handleEdit = (id) => {
    setOpenMenuId(null);
    navigate(`/seller/products/${id}/edit`);
  };

  const handleView = (id) => {
    setOpenMenuId(null);
    navigate(`/seller/products/${id}`);
  };

  const handleDeleteClick = (id, name) => {
    setOpenMenuId(null);
    setDeleteTarget({ id, name });
  };

  return (
    <div className="animate-fade-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">My Products</h1>
          <p className="text-sm text-[#6B6B6B]">Manage your product listings and inventory.</p>
        </div>
        <button onClick={() => navigate("/seller/products/add")} className="text-sm font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shrink-0">+ Add Product</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors duration-200 ${filter === f ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading your products...</p>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchProducts} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 text-center">
          <p className="text-sm text-[#6B6B6B] mb-1">
            {products.length === 0 ? "You haven't added any products yet." : "No products match your search."}
          </p>
          {products.length === 0 && (
            <button onClick={() => navigate("/seller/products/add")} className="text-xs font-medium text-[#C9A227] hover:underline mt-2">Add your first product</button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="hidden sm:block border border-[#E5E5E5] rounded-2xl bg-white" style={{ overflow: "visible" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-[#6B6B6B] border-b border-[#E5E5E5]">
                  <th className="py-3 px-5 font-medium">Product</th>
                  <th className="py-3 px-2 font-medium">Category</th>
                  <th className="py-3 px-2 font-medium">Price</th>
                  <th className="py-3 px-2 font-medium">Stock</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Sales</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#FAFAFA]" />
                        <span className="font-medium text-[#111111]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[#6B6B6B] capitalize">{p.category}</td>
                    <td className="py-3 px-2 text-[#111111]">${p.price}</td>
                    <td className="py-3 px-2 text-[#6B6B6B]">{p.stock}</td>
                    <td className="py-3 px-2"><StatusBadge status={p.displayStatus} /></td>
                    <td className="py-3 px-2 text-[#6B6B6B]">{p.sales}</td>
                    <td className="py-3 px-5 text-right">
                      <ProductActionsMenu
                        product={p}
                        open={openMenuId === p.id}
                        onToggle={() => setOpenMenuId((prev) => (prev === p.id ? null : p.id))}
                        onClose={() => setOpenMenuId(null)}
                        onEdit={() => handleEdit(p.id)}
                        onView={() => handleView(p.id)}
                        onDelete={() => handleDeleteClick(p.id, p.name)}
                        onTogglePublish={() => handleTogglePublish(p)}
                        publishing={publishingId === p.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="border border-[#E5E5E5] rounded-2xl p-4 bg-white flex gap-3">
                <img src={p.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#FAFAFA]" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 items-start">
                    <p className="text-sm font-medium text-[#111111] truncate">{p.name}</p>
                    <ProductActionsMenu
                      product={p}
                      open={openMenuId === p.id}
                      onToggle={() => setOpenMenuId((prev) => (prev === p.id ? null : p.id))}
                      onClose={() => setOpenMenuId(null)}
                      onEdit={() => handleEdit(p.id)}
                      onView={() => handleView(p.id)}
                      onDelete={() => handleDeleteClick(p.id, p.name)}
                      onTogglePublish={() => handleTogglePublish(p)}
                      publishing={publishingId === p.id}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={p.displayStatus} />
                    <p className="text-xs text-[#6B6B6B] capitalize">{p.category} · ${p.price} · Stock {p.stock}</p>
                  </div>
                  {p.approvalStatus === "pending" && <p className="text-[11px] text-[#8a6f14] mt-1">This product is waiting for admin approval.</p>}
                  {p.approvalStatus === "rejected" && <p className="text-[11px] text-red-500 mt-1">Rejected{p.rejectionReason ? `: ${p.rejectionReason}` : "."} Edit to resubmit.</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        productName={deleteTarget?.name}
        deleting={deletingId === deleteTarget?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}