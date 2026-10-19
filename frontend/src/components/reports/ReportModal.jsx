import { useEffect, useState } from "react";
import { createReport } from "../../services/reportApi";
import { REPORT_REASONS } from "../../data/reportOptions";
import { FlagIcon } from "../icons/FlagIcon";
import { Spinner } from "../ui/Spinner";

const MAX_DETAILS = 1000;

export function ReportModal({ open, onClose, targetType, targetId, targetName }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetails("");
    setError("");
    setDone(false);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const options = REPORT_REASONS[targetType] || [];
  const noun = targetType === "store" ? "store" : "product";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!reason) { setError("Please choose a reason."); return; }
    if (reason === "other" && details.trim().length < 10) { setError("Please add a few details (at least 10 characters)."); return; }

    setSubmitting(true);
    try {
      await createReport({ targetType, targetId, reason, details: details.trim() });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not send your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Report this ${noun}`} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={submitting ? undefined : onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-[#E5E5E5] p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline className="check-draw" points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-lg font-serif text-[#111111] mb-1">Thank you</p>
            <p className="text-sm text-[#6B6B6B] mb-1">Our team will review your report.</p>
            <p className="text-xs text-[#B0B0B0] mb-6">You'll get a notification when the review is finished.</p>
            <button onClick={onClose} className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-start gap-3 mb-5">
              <span className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><FlagIcon size={18} /></span>
              <div className="min-w-0">
                <p className="text-base font-serif text-[#111111]">Report this {noun}</p>
                {targetName && <p className="text-xs text-[#6B6B6B] truncate">{targetName}</p>}
              </div>
            </div>

            <fieldset className="space-y-2 mb-4">
              <legend className="text-xs font-medium text-[#6B6B6B] mb-2">What's wrong?</legend>
              {options.map((option) => (
                <label key={option.value} className="block cursor-pointer">
                  <input type="radio" name="reason" value={option.value} checked={reason === option.value} onChange={() => { setReason(option.value); setError(""); }} className="peer sr-only" />
                  <span className="block rounded-2xl border border-[#E5E5E5] px-4 py-2.5 transition-all peer-checked:border-[#C9A227] peer-checked:bg-[#FBF6E9] peer-focus-visible:ring-2 peer-focus-visible:ring-[#C9A227]/40 hover:border-[#C9A227]/50">
                    <span className="block text-sm text-[#111111]">{option.label}</span>
                    <span className="block text-[11px] text-[#6B6B6B]">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="mb-4">
              <label htmlFor="report-details" className="block text-xs font-medium text-[#6B6B6B] mb-1.5">
                Details {reason === "other" ? "(required)" : "(optional)"}
              </label>
              <textarea
                id="report-details"
                rows={3}
                maxLength={MAX_DETAILS}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Anything that helps our team understand the problem."
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] focus:bg-white transition-all resize-none"
              />
              <p className="text-[11px] text-[#B0B0B0] text-right mt-1">{details.length}/{MAX_DETAILS}</p>
            </div>

            {error && <div role="alert" className="mb-4 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs">{error}</div>}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={submitting} className="flex-1 border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Spinner size={13} />}
                {submitting ? "Sending..." : "Send report"}
              </button>
            </div>
            <p className="text-[11px] text-[#B0B0B0] text-center mt-3">Reports are only visible to our team.</p>
          </form>
        )}
      </div>
    </div>
  );
}