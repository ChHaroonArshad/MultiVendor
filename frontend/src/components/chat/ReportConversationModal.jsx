import { useEffect, useState } from "react";
import { reportConversation } from "../../services/chatApi";
import { useToast } from "../../context/ToastContext";
import { Spinner } from "../ui/Spinner";
import { CATEGORY_LABEL } from "../../utils/chatUtils";

export function ReportConversationModal({ open, conversationId, onClose }) {
  const { showToast } = useToast();
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setCategory(""); setDetails(""); setError(""); }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!category) { setError("Please choose what went wrong."); return; }
    setSubmitting(true);
    try {
      await reportConversation(conversationId, { category, details: details.trim() });
      showToast("Report sent. Our team will review this conversation.");
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't send the report.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 chat-slide-up" onClick={submitting ? undefined : onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E5E5] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-[#111111] mb-1">Report this conversation</p>
        <p className="text-xs text-[#6B6B6B] mb-4">Marketplace Support will review it. The other person is not told who reported.</p>

        <div className="space-y-2 mb-4">
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setCategory(value); setError(""); }}
              className={`w-full text-left text-sm rounded-2xl border px-4 py-2.5 transition-colors ${category === value ? "border-[#C9A227] bg-[#FBF6E9]" : "border-[#E5E5E5] hover:border-[#C9A227]/50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Anything else we should know? (optional)"
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] resize-none"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="flex flex-col gap-2 mt-4">
          <button onClick={submit} disabled={submitting} className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Spinner size={13} />}
            Send report
          </button>
          <button onClick={onClose} disabled={submitting} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}