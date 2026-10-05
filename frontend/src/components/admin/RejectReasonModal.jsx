import { useState } from "react";

export function RejectReasonModal({ open, productName, title, onCancel, onSubmit, submitting }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters).");
      return;
    }
    setError("");
    onSubmit(reason.trim());
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-[#111111] mb-1">{title || `Reject "${productName}"`}</p>
        <p className="text-xs text-[#6B6B6B] mb-4">Let the seller know why this product was {title ? "removed" : "rejected"}.</p>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(""); }}
          rows={4}
          placeholder="e.g. Product images are unclear, description is incomplete..."
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all resize-none mb-1"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex flex-col gap-2 mt-3">
          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {submitting ? "Submitting..." : title ? "Revoke & Notify Seller" : "Reject Product"}
          </button>
          <button onClick={onCancel} disabled={submitting} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}