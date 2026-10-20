import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../../context/ToastContext";
import { useSellerStore } from "../../hooks/useSellerStore";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import { FieldError, inputClass, labelClass, textareaClass } from "../../components/settings/settingsUi";
import { getMyStore, updateMyStore, uploadStoreImage, removeStoreImage } from "../../services/storeApi";

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Gaming", "Accessories"];
const MAX_IMAGE_MB = 3;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FORM_FIELDS = ["storeName", "description", "category", "contactEmail", "phone"];
const READY_MESSAGE = "Your store is ready! You can now add products.";

// UX only: the backend repeats every rule.
const storeSchema = z.object({
  storeName: z.string().trim().min(3, "Store name must be at least 3 characters.").max(60, "Store name must be under 60 characters."),
  description: z.string().trim().max(500, "Description must be under 500 characters."),
  category: z.string().trim().max(50),
  contactEmail: z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email address."),
  phone: z.string().trim().refine((v) => v === "" || /^[0-9+()\-\s]{7,20}$/.test(v), "Enter a valid phone number."),
});

const toFormValues = (store) => ({
  storeName: store?.storeName || "",
  description: store?.description || "",
  category: store?.category || "",
  contactEmail: store?.contactEmail || "",
  phone: store?.phone || "",
});

function SetupChecklist({ completion, reason }) {
  const intro =
    reason === "add-product"
      ? "You need a complete store before you can add products."
      : "Set up your store first. It only takes a minute.";
  const percent = Math.round((completion.done / completion.total) * 100);

  return (
    <div className="border border-[#C9A227]/40 bg-[#FBF6E9] rounded-2xl p-5 sm:p-6 mb-6 animate-fade-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-serif text-[#111111]">Complete your store to start selling</p>
          <p className="text-xs text-[#6B6B6B] mt-1">{intro}</p>
        </div>
        <p className="text-xs font-medium text-[#8a6f14] shrink-0">{completion.done} of {completion.total}</p>
      </div>

      <div className="h-1.5 rounded-full bg-white/80 mt-4 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-[#C9A227] rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-4 space-y-2.5">
        {completion.items.map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.done ? "bg-emerald-500 text-white" : "border border-[#C9A227]/50 bg-white"}`}>
              {item.done && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </span>
            <span>
              <span className={`block text-sm ${item.done ? "text-[#6B6B6B] line-through" : "text-[#111111] font-medium"}`}>{item.label}</span>
              {!item.done && <span className="block text-xs text-[#6B6B6B]">{item.hint}</span>}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-[#8a6f14]/80 mt-4">Click Save changes after editing. This list updates once your changes are saved.</p>
    </div>
  );
}

function ImageSlot({ label, hint, src, busy, wide, onSelect, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 overflow-hidden border border-[#E5E5E5] bg-[#FAFAFA] ${wide ? "w-48 h-16 rounded-xl" : "w-16 h-16 rounded-2xl"}`}>
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#B0B0B0]">No image</div>
          )}
          {busy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Spinner size={16} className="text-[#111111]" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
              {src ? "Change" : "Upload"}
            </button>
            {src && (
              <button type="button" onClick={onRemove} disabled={busy} className="text-xs text-red-500 hover:underline disabled:opacity-50">Remove</button>
            )}
          </div>
          <p className="text-[11px] text-[#B0B0B0] mt-1.5">{hint}</p>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onSelect} className="hidden" />
      </div>
    </div>
  );
}

export function SellerStorePage() {
  const { showToast } = useToast();
  const location = useLocation();
  const { completion, setCompletion } = useSellerStore();
  const reason = location.state?.reason;

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyKind, setBusyKind] = useState(null);

  const {
    register, handleSubmit, reset, setError, watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(storeSchema), defaultValues: toFormValues(null) });

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    return getMyStore()
      .then((res) => {
        setStore(res.data.store);
        setCompletion(res.data.completion);
        reset(toFormValues(res.data.store));
      })
      .catch((err) => setLoadError(err.message || "Failed to load your store."))
      .finally(() => setLoading(false));
  }, [reset, setCompletion]);

  useEffect(() => { load(); }, [load]);

  // The "store is ready" toast replaces the generic one, and only fires on the incomplete -> complete step.
  const announce = (nextCompletion, wasIncomplete, message) => {
    setCompletion(nextCompletion);
    showToast(wasIncomplete && nextCompletion.complete ? READY_MESSAGE : message);
  };

  const onSubmit = async (values) => {
    const wasIncomplete = completion?.complete === false;
    try {
      const res = await updateMyStore(values);
      setStore(res.data.store);
      reset(toFormValues(res.data.store));
      announce(res.data.completion, wasIncomplete, "Store updated");
    } catch (err) {
      let mapped = false;
      err.fieldErrors?.forEach(({ field, message }) => {
        if (FORM_FIELDS.includes(field)) {
          setError(field, { type: "server", message });
          mapped = true;
        }
      });
      if (!mapped) showToast(err.message || "Could not update your store.", "error");
    }
  };

  // Image changes only touch `store`, never the form, so unsaved text edits are never lost.
  const handleImageSelected = async (kind, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      showToast("Please choose a JPG, PNG or WebP image.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showToast(`Image must be under ${MAX_IMAGE_MB}MB.`, "error");
      return;
    }

    const wasIncomplete = completion?.complete === false;
    setBusyKind(kind);
    try {
      const res = await uploadStoreImage(kind, file);
      setStore(res.data.store);
      announce(res.data.completion, wasIncomplete, kind === "logo" ? "Logo updated" : "Banner updated");
    } catch (err) {
      showToast(err.message || "Could not upload the image.", "error");
    } finally {
      setBusyKind(null);
    }
  };

  const handleImageRemoved = async (kind) => {
    setBusyKind(kind);
    try {
      const res = await removeStoreImage(kind);
      setStore(res.data.store);
      setCompletion(res.data.completion);
      showToast(kind === "logo" ? "Logo removed" : "Banner removed");
    } catch (err) {
      showToast(err.message || "Could not remove the image.", "error");
    } finally {
      setBusyKind(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading your store...</p>
      </div>
    );
  }

  if (loadError || !store) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{loadError || "Store not found."}</p>
        <button onClick={load} className="text-xs font-medium text-[#C9A227] hover:underline">Try again</button>
      </div>
    );
  }

  const liveName = watch("storeName") || store.storeName;
  const liveDescription = watch("description");
  const liveCategory = watch("category");

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Store</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Manage how your store appears to customers.</p>

      {completion && !completion.complete && <SetupChecklist completion={completion} reason={reason} />}

      {completion?.complete && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-emerald-700">Your store is complete. You can add products.</p>
          <Link to="/seller/products/add" className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all">
            Add a product
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-6">
            <ImageSlot
              label="Banner" hint={`Wide image, up to ${MAX_IMAGE_MB}MB. Optional.`} src={store.banner} wide
              busy={busyKind === "banner"}
              onSelect={(e) => handleImageSelected("banner", e)}
              onRemove={() => handleImageRemoved("banner")}
            />
            <ImageSlot
              label="Logo (required)" hint={`Square image, up to ${MAX_IMAGE_MB}MB.`} src={store.logo}
              busy={busyKind === "logo"}
              onSelect={(e) => handleImageSelected("logo", e)}
              onRemove={() => handleImageRemoved("logo")}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-5">
            <div>
              <label htmlFor="storeName" className={labelClass}>Store name</label>
              <input id="storeName" {...register("storeName")} className={inputClass(!!errors.storeName)} />
              <FieldError message={errors.storeName?.message} />
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>Description (required, at least 20 characters)</label>
              <textarea id="description" rows={4} {...register("description")} className={textareaClass(!!errors.description)} />
              <FieldError message={errors.description?.message} />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>Main category (required)</label>
              <select id="category" {...register("category")} className={inputClass(!!errors.category)}>
                <option value="">Not set</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <FieldError message={errors.category?.message} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactEmail" className={labelClass}>Contact email</label>
                <input id="contactEmail" type="email" {...register("contactEmail")} className={inputClass(!!errors.contactEmail)} />
                <p className="text-[11px] text-[#B0B0B0] mt-1.5 ml-1">Shown publicly on your store page.</p>
                <FieldError message={errors.contactEmail?.message} />
              </div>
              <div>
                <label htmlFor="storePhone" className={labelClass}>Phone</label>
                <input id="storePhone" type="tel" {...register("phone")} className={inputClass(!!errors.phone)} />
                <p className="text-[11px] text-[#B0B0B0] mt-1.5 ml-1">Private, never shown to customers.</p>
                <FieldError message={errors.phone?.message} />
              </div>
            </div>

            <button type="submit" disabled={!isDirty || isSubmitting} className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2">
              {isSubmitting && <Spinner size={13} />}
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white h-fit">
          {store.banner ? (
            <img src={store.banner} alt="" className="w-full h-28 object-cover" />
          ) : (
            <div className="h-28 bg-gradient-to-br from-[#FBF6E9] to-[#F0F0F0]" />
          )}
          <div className="p-5">
            <div className="-mt-12 mb-3 w-14 h-14 rounded-full border-2 border-white shadow overflow-hidden bg-white">
              <Avatar name={liveName} src={store.logo} size={52} />
            </div>
            <p className="text-sm font-medium text-[#111111]">{liveName}</p>
            {liveCategory && <p className="text-xs text-[#C9A227] mt-0.5">{liveCategory}</p>}
            {liveDescription && <p className="text-xs text-[#6B6B6B] mt-2 line-clamp-4">{liveDescription}</p>}
            <Link to={`/store/${store.seller}`} className="block text-center w-full mt-4 text-xs font-medium border border-[#E5E5E5] py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">
              View public store
            </Link>
            <p className="text-[11px] text-[#B0B0B0] mt-2 text-center">Listed on the marketplace once you have a published product.</p>
          </div>
        </div>
      </div>
    </div>
  );
}