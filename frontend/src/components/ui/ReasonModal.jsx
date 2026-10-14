import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

export function ReasonModal({ open, title, description, placeholder = "Write the reason here...", confirmLabel = "Submit", submitting = false, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // start empty every time the modal opens
  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      setError("Please give a reason (at least 5 characters).");
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up" onClick={submitting ? undefined : onCancel}>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-[#111111] mb-1">{title}</p>
        <p className="text-xs text-[#6B6B6B] mb-4">{description}</p>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(""); }}
          rows={4}
          maxLength={500}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all resize-none mb-1"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex flex-col gap-2 mt-3">
          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Spinner size={13} />}
            {submitting ? "Please wait..." : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={submitting} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}