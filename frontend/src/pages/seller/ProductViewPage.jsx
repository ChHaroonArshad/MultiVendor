import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../../services/productApi";
import { StatusBadge } from "../../pages/seller/StatusBadge";

function computeDisplayStatus(p) {
  if (p.stock === 0) return "out-of-stock";
  if (p.approvalStatus === "pending") return "pending";
  if (p.approvalStatus === "rejected") return "rejected";
  return p.isPublished ? "published" : "draft";
}

export function ProductViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getProduct(id)
      .then((res) => { if (!cancelled) setProduct(res.data.product); })
      .catch((err) => { if (!cancelled) setError(err?.message || "Failed to load product."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#6B6B6B]">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "Product not found."}</p>
        <button onClick={() => navigate("/seller/products")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Products</button>
      </div>
    );
  }

  const displayStatus = computeDisplayStatus(product);

  return (
    <div className="animate-fade-slide-up max-w-3xl">
      <button onClick={() => navigate("/seller/products")} className="text-xs text-[#6B6B6B] hover:text-[#111111] mb-4">← Back to Products</button>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">{product.name}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={displayStatus} />
            <span className="text-xs text-[#6B6B6B] capitalize">{product.category}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/seller/products/${product._id}/edit`)} className="text-sm font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shrink-0">Edit Product</button>
      </div>

      {product.approvalStatus === "pending" && (
        <div className="mb-5 border border-[#E5E5E5] bg-[#FBF6E9] rounded-2xl px-4 py-3">
          <p className="text-sm text-[#8a6f14]">This product is waiting for admin approval.</p>
        </div>
      )}
      {product.approvalStatus === "rejected" && (
        <div className="mb-5 border border-red-200 bg-red-50 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium mb-0.5">This product was rejected by the admin team.</p>
          {product.rejectionReason && <p className="text-sm text-red-600 mb-2">{product.rejectionReason}</p>}
          <button onClick={() => navigate(`/seller/products/${product._id}/edit`)} className="text-xs font-medium text-red-600 underline hover:no-underline">
            Edit and resubmit for review
          </button>
        </div>
      )}
      {product.approvalStatus === "approved" && !product.isPublished && (
        <div className="mb-5 border border-[#E5E5E5] bg-[#FAFAFA] rounded-2xl px-4 py-3">
          <p className="text-sm text-[#6B6B6B]">This product is approved but currently unpublished — customers can't see it. Publish it from the My Products page.</p>
        </div>
      )}

      {product.images?.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {product.images.map((img) => (
            <div key={img.publicId} className="aspect-square rounded-xl overflow-hidden border border-[#E5E5E5] bg-[#FAFAFA]">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-4 mb-5">
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
    </div>
  );
}