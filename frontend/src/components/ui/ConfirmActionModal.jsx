import { Spinner } from "./Spinner";

export function ConfirmActionModal({ open, title, message, confirmLabel = "Confirm", danger = false, loading = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up" onClick={loading ? undefined : onCancel}>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className={`w-11 h-11 mx-auto rounded-full border flex items-center justify-center text-lg mb-4 ${danger ? "bg-red-50 border-red-200 text-red-500" : "bg-[#FBF6E9] border-[#C9A227]/40 text-[#C9A227]"}`}>!</div>
        <p className="text-sm font-medium text-[#111111] mb-1">{title}</p>
        <p className="text-xs text-[#6B6B6B] mb-5">{message}</p>
        <div className="flex flex-col gap-2">
          <button onClick={onConfirm} disabled={loading} className={`w-full text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${danger ? "bg-red-500" : "bg-[#111111]"}`}>
            {loading && <Spinner size={13} />}
            {loading ? "Please wait..." : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}