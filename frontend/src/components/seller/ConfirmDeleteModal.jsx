export function ConfirmDeleteModal({ open, productName, onConfirm, onCancel, deleting }) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-11 h-11 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 text-lg mb-4">!</div>
        <p className="text-sm font-medium text-[#111111] mb-1">Delete this product?</p>
        <p className="text-xs text-[#6B6B6B] mb-5">"{productName}" will be permanently removed. This can't be undone.</p>
        <div className="flex flex-col gap-2">
          <button onClick={onConfirm} disabled={deleting} className="w-full bg-red-500 text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete Product"}
          </button>
          <button onClick={onCancel} disabled={deleting} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}