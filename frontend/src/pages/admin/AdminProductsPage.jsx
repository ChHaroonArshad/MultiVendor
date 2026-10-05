import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts, approveProduct, rejectProduct } from "../../services/adminProductApi";
import { AdminStatusBadge } from "./AdminStatusBadge";

import { RejectReasonModal } from "../../components/admin/RejectReasonModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

export function AdminProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // { id, name, mode: "reject" | "revoke" }
  const [rejecting, setRejecting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllProducts(statusFilter);
      setProducts(res.data.products);
    } catch (err) {
      setError(err?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const handleApprove = async (product) => {
    setActingId(product._id);
    try {
      const res = await approveProduct(product._id);
      setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
      showToast(`"${product.name}" approved and published`);
    } catch (err) {
      showToast(err?.message || "Failed to approve product.", "error");
    } finally {
      setActingId(null);
    }
  };

  const handleRejectSubmit = async (reason) => {
    setRejecting(true);
    try {
      const res = await rejectProduct(rejectTarget.id, reason);
      setProducts((prev) => prev.map((p) => (p._id === rejectTarget.id ? res.data.product : p)));
      showToast(rejectTarget.mode === "revoke" ? `"${rejectTarget.name}" approval revoked` : `"${rejectTarget.name}" rejected`);
      setRejectTarget(null);
    } catch (err) {
      showToast(err?.message || "Failed to update product.", "error");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Products</h1>
        <p className="text-sm text-[#6B6B6B]">Review product submissions and manage the full catalog.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or seller..."
          className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${statusFilter === s ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading products...</p>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchProducts} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                  <th className="py-3 px-5 font-medium">Product</th>
                  <th className="py-3 px-5 font-medium">Seller</th>
                  <th className="py-3 px-5 font-medium">Category</th>
                  <th className="py-3 px-5 font-medium">Price</th>
                  <th className="py-3 px-5 font-medium">Submitted</th>
                  <th className="py-3 px-5 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-5">
                      <button onClick={() => navigate(`/admin/products/${p._id}`)} className="flex items-center gap-3 text-left">
                        <img src={p.images?.[0]?.url} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#FAFAFA]" />
                        <span className="text-[#111111] font-medium hover:text-[#C9A227] transition-colors whitespace-nowrap">{p.name}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{p.seller?.name || "—"}</td>
                    <td className="py-3.5 px-5 text-[#6B6B6B] capitalize whitespace-nowrap">{p.category}</td>
                    <td className="py-3.5 px-5 text-[#111111]">${p.price}</td>
                    <td className="py-3.5 px-5 text-[#6B6B6B] whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5"><AdminStatusBadge status={p.approvalStatus} /></td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {p.approvalStatus === "pending" && (
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => handleApprove(p)} disabled={actingId === p._id} className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {actingId === p._id && <Spinner size={11} />}
                            Approve
                          </button>
                          <button onClick={() => setRejectTarget({ id: p._id, name: p.name, mode: "reject" })} className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                      {p.approvalStatus === "approved" && (
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => navigate(`/admin/products/${p._id}`)} className="text-xs font-medium text-[#C9A227] hover:underline">View</button>
                          <button onClick={() => setRejectTarget({ id: p._id, name: p.name, mode: "revoke" })} className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors">
                            Revoke
                          </button>
                        </div>
                      )}
                      {p.approvalStatus === "rejected" && (
                        <button onClick={() => navigate(`/admin/products/${p._id}`)} className="text-xs font-medium text-[#C9A227] hover:underline">View</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-[#B0B0B0]">No products match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RejectReasonModal
        open={!!rejectTarget}
        productName={rejectTarget?.name}
        title={rejectTarget?.mode === "revoke" ? `Revoke approval for "${rejectTarget?.name}"` : undefined}
        submitting={rejecting}
        onCancel={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}