import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, approveProduct, rejectProduct } from "../../services/adminProductApi";
import { AdminStatusBadge } from "./AdminStatusBadge";

import { RejectReasonModal } from "../../components/admin/RejectReasonModal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";

export function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getProduct(id)
      .then((res) => { if (!cancelled) { setProduct(res.data.product); setActiveImage(0); } })
      .catch((err) => { if (!cancelled) setError(err?.message || "Failed to load product."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleApprove = async () => {
    setActing(true);
    try {
      const res = await approveProduct(id);
      setProduct(res.data.product);
      showToast(`"${res.data.product.name}" approved and published`);
    } catch (err) {
      showToast(err?.message || "Failed to approve product.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleRejectSubmit = async (reason) => {
    setActing(true);
    try {
      const res = await rejectProduct(id, reason);
      setProduct(res.data.product);
      showToast(isRevoke ? `"${res.data.product.name}" approval revoked` : `"${res.data.product.name}" rejected`);
      setRejectOpen(false);
    } catch (err) {
      showToast(err?.message || "Failed to update product.", "error");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading product...</p>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "Product not found."}</p>
        <button onClick={() => navigate("/admin/products")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Products</button>
      </div>
    );
  }

  const isRevoke = product.approvalStatus === "approved";

  return (
    <div className="max-w-4xl space-y-5">
      <button onClick={() => navigate("/admin/products")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Products</button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif text-[#111111] mb-1">{product.name}</h1>
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={product.approvalStatus} />
            <span className="text-xs text-[#6B6B6B]">by {product.seller?.name || "Unknown seller"} · {product.seller?.email}</span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {product.approvalStatus === "pending" && (
            <button onClick={handleApprove} disabled={acting} className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
              {acting && <Spinner size={13} />}
              {acting ? "Approving..." : "Approve"}
            </button>
          )}
          {(product.approvalStatus === "pending" || isRevoke) && (
            <button onClick={() => setRejectOpen(true)} disabled={acting} className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] text-[#C0392B] hover:border-[#C0392B]/50 transition-colors disabled:opacity-50">
              {isRevoke ? "Revoke" : "Reject"}
            </button>
          )}
        </div>
      </div>

      {product.approvalStatus === "rejected" && product.rejectionReason && (
        <div className="border border-red-200 bg-red-50 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium mb-0.5">Rejection reason</p>
          <p className="text-sm text-red-600">{product.rejectionReason}</p>
        </div>
      )}

      {product.images?.length > 0 && (
        <div>
          <div className="aspect-video rounded-2xl overflow-hidden border border-[#E5E5E5] bg-[#FAFAFA] mb-3">
            <img src={product.images[activeImage]?.url} alt="" className="w-full h-full object-contain" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button key={img.publicId} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImage ? "border-[#C9A227]" : "border-transparent"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[#6B6B6B] mb-1">Price</p>
            <p className="text-sm font-medium text-[#111111]">
              ${product.price}
              {product.originalPrice && <span className="text-xs text-[#B0B0B0] line-through ml-1.5">${product.originalPrice}</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6B6B6B] mb-1">Stock</p>
            <p className="text-sm font-medium text-[#111111]">{product.stock}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B6B6B] mb-1">Category</p>
            <p className="text-sm font-medium text-[#111111] capitalize">{product.category}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-[#6B6B6B] mb-1">Description</p>
          <p className="text-sm text-[#111111]">{product.description}</p>
        </div>
      </div>

      {product.specs?.length > 0 && (
        <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white">
          <p className="text-xs text-[#6B6B6B] mb-3">Specifications</p>
          <div className="space-y-2">
            {product.specs.map((s, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-[#F0F0F0] last:border-0 pb-2 last:pb-0">
                <span className="text-[#6B6B6B]">{s.key}</span>
                <span className="text-[#111111] font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RejectReasonModal
        open={rejectOpen}
        productName={product.name}
        title={isRevoke ? `Revoke approval for "${product.name}"` : undefined}
        submitting={acting}
        onCancel={() => setRejectOpen(false)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}