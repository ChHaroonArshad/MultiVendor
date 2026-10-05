import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, updateProduct } from "../../services/productApi";
import { useToast } from "../../context/ToastContext";

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Gaming", "Accessories"];
const MAX_FILE_MB = 5;
const MAX_IMAGES = 6;

const fieldClass = "w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";
const textAreaClass = "w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all resize-none";

export function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // inside the component:
  const { showToast } = useToast();



  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [existingImages, setExistingImages] = useState([]); // [{ url, publicId }] — the "keep" list, shrinks when a ✕ is clicked
  const [form, setForm] = useState({ name: "", category: "", price: "", originalPrice: "", stock: "", description: "" });
  const [newImages, setNewImages] = useState([]); // [{ file, previewUrl }] — purely additive now, not a replacement
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((res) => {
        if (cancelled) return;
        const p = res.data.product;
        setForm({
          name: p.name,
          category: p.category,
          price: String(p.price),
          originalPrice: p.originalPrice ? String(p.originalPrice) : "",
          stock: String(p.stock),
          description: p.description,
        });
        setExistingImages(p.images || []);
        setSpecs(p.specs?.length > 0 ? p.specs : [{ key: "", value: "" }]);
      })
      .catch((err) => { if (!cancelled) setLoadError(err?.message || "Failed to load product."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const totalImageCount = existingImages.length + newImages.length;

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const tooLargeOrInvalid = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024 || !f.type.startsWith("image/"));
    const valid = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024 && f.type.startsWith("image/"));

    if (tooLargeOrInvalid.length > 0) {
      showToast(`${tooLargeOrInvalid.length} image(s) skipped — each must be under ${MAX_FILE_MB}MB and a valid image file.`, "error");
    }

    const remainingSlots = MAX_IMAGES - totalImageCount;
    const accepted = valid.slice(0, Math.max(0, remainingSlots));
    if (accepted.length < valid.length) {
      showToast(`You can have up to ${MAX_IMAGES} images total.`, "error");
    }

    setErrors((er) => ({ ...er, images: undefined }));
    const withPreviews = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewImages((prev) => [...prev, ...withPreviews]);
    e.target.value = "";
  };

  const removeExistingImage = (publicId) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateSpec = (index, field, value) =>
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  const addSpecRow = () => setSpecs((prev) => [...prev, { key: "", value: "" }]);
  const removeSpecRow = (index) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Product name is required.";
    if (!form.category) next.category = "Please select a category.";
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price.";
    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
      next.originalPrice = "Compare-at price must be higher than the price.";
    }
    if (form.stock === "" || Number(form.stock) < 0) next.stock = "Enter a valid stock quantity.";
    if (!form.description.trim() || form.description.trim().length < 20) {
      next.description = "Description must be at least 20 characters.";
    }
    if (totalImageCount === 0) next.images = "Add at least one product image.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    const cleanSpecs = specs.filter((s) => s.key.trim() && s.value.trim());

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    if (form.originalPrice) formData.append("originalPrice", form.originalPrice);
    formData.append("stock", form.stock);
    formData.append("category", form.category);
    formData.append("specs", JSON.stringify(cleanSpecs));
    // Always sent — tells the backend exactly which existing images survive.
    formData.append("keepImagePublicIds", JSON.stringify(existingImages.map((img) => img.publicId)));
    newImages.forEach((img) => formData.append("images", img.file));

    setSubmitting(true);
    try {
      const res = await updateProduct(id, formData);
      navigate(`/seller/products/${res.data.product._id}`, { state: { justUpdated: true } });
    } catch (err) {
      setSubmitError(err?.message || "Failed to update product. Please try again.");
      showToast(err?.message || "Failed to update product. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-[#6B6B6B]">Loading product...</div>;
  if (loadError) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{loadError}</p>
        <button onClick={() => navigate("/seller/products")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Products</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-slide-up ">
      <button onClick={() => navigate(`/seller/products/${id}`)} className="text-xs text-[#6B6B6B] hover:text-[#111111] mb-4">← Back to Product</button>

      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Edit Product</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Update your listing details below.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Product Name</label>
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={fieldClass} />
            {errors.name && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)} className={fieldClass}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Stock Quantity</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setField("stock", e.target.value)} className={fieldClass} />
              {errors.stock && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.stock}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} className={fieldClass} />
              {errors.price && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Compare-at Price ($) <span className="text-[#B0B0B0]">— optional</span></label>
              <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => setField("originalPrice", e.target.value)} className={fieldClass} />
              {errors.originalPrice && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.originalPrice}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => setField("description", e.target.value)} className={textAreaClass} />
            <div className="flex justify-between mt-1">
              {errors.description ? <p className="ml-1 text-xs text-red-500">{errors.description}</p> : <span />}
              <p className="mr-1 text-[11px] text-[#B0B0B0]">{form.description.length}/500</p>
            </div>
          </div>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white">
          <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Specifications <span className="text-[#B0B0B0]">— optional</span></label>
          <div className="space-y-2 mt-3">
            {specs.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="e.g. Material" className="w-1/3 px-3.5 py-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
                <input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="e.g. Solid walnut wood" className="flex-1 px-3.5 py-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
                <button type="button" onClick={() => removeSpecRow(i)} aria-label="Remove specification" className="w-8 h-8 shrink-0 rounded-full text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-red-500 transition-colors  cursor-pointer">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpecRow} className="mt-3 text-xs font-medium text-[#C9A227] hover:underline  cursor-pointer">+ Add specification</button>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white">
          <label className="block text-xs font-medium text-[#6B6B6B] mb-3">Product Images <span className="text-[#B0B0B0]">— {totalImageCount}/{MAX_IMAGES}, click ✕ to remove one</span></label>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
            {existingImages.map((img, i) => (
              <div key={img.publicId} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5E5E5] group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] uppercase bg-white/90 text-[#111111] px-1.5 py-0.5 rounded-full">Main</span>}
                <button
                  type="button" onClick={() => removeExistingImage(img.publicId)} aria-label="Remove image"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            {newImages.map((img, i) => (
              <div key={img.previewUrl} className="relative aspect-square rounded-xl overflow-hidden border border-[#C9A227]/50 group">
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[9px] uppercase bg-[#C9A227] text-white px-1.5 py-0.5 rounded-full">New</span>
                <button
                  type="button" onClick={() => removeNewImage(i)} aria-label="Remove image"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity  cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            {totalImageCount < MAX_IMAGES && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-[#E5E5E5] flex flex-col items-center justify-center text-[#6B6B6B] cursor-pointer hover:border-[#C9A227]/50 transition-colors">
                <span className="text-xl">+</span>
                <span className="text-[10px] mt-1">Add photo</span>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            )}
          </div>
          {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
        </div>

        {submitError && (
          <div className="border border-red-200 bg-red-50 rounded-2xl px-4 py-3">
            <p className="text-xs text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate(`/seller/products/${id}`)} className="text-sm font-medium border border-[#E5E5E5] px-6 py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}