import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAdminReport, startReportReview, resolveReport } from "../../services/adminReportApi";
import { ReportStatusBadge, ReportTypeBadge } from "../../components/reports/ReportBadges";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";
import { shortOrderId } from "../../utils/orderUtils";
import { REASON_LABELS } from "../../data/reportOptions";

function Card({ title, children }) {
  return (
    <div className="border border-[#E5E5E5] rounded-2xl p-5 bg-white">
      <p className="text-xs text-[#6B6B6B] mb-3">{title}</p>
      {children}
    </div>
  );
}

function NoteModal({ open, title, description, confirmLabel, danger, busy, onConfirm, onCancel }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setNote(""); setError(""); } }, [open]);
  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (trimmed.length < 5) { setError("Please write at least 5 characters."); return; }
    onConfirm(trimmed);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={busy ? undefined : onCancel}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-[#111111] mb-1">{title}</p>
        <p className="text-xs text-[#6B6B6B] mb-4">{description}</p>
        <label htmlFor="resolution-note" className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Internal note (not shown to the reporter)</label>
        <textarea id="resolution-note" rows={3} maxLength={500} value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] focus:bg-white transition-all resize-none" />
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel} disabled={busy} className="flex-1 border border-[#E5E5E5] py-2.5 rounded-full text-xs font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy} className={`flex-1 text-white py-2.5 rounded-full text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${danger ? "bg-red-500" : "bg-[#111111]"}`}>
            {busy && <Spinner size={12} />}
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // "resolved" | "dismissed" | null

  const load = () =>
    getAdminReport(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || "Failed to load report."))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    setError("");
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartReview = async () => {
    setBusy(true);
    try {
      await startReportReview(id);
      showToast("Review started");
      await load();
    } catch (err) {
      showToast(err.message || "Could not start the review.", "error");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async (note) => {
    setBusy(true);
    try {
      await resolveReport(id, { outcome: modal, note });
      showToast(modal === "dismissed" ? "Report dismissed" : "Report resolved");
      setModal(null);
      await load();
    } catch (err) {
      showToast(err.message || "Could not close the report.", "error");
      setModal(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2">
        <Spinner size={16} className="text-[#6B6B6B]" />
        <p className="text-sm text-[#6B6B6B]">Loading report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">{error || "Report not found."}</p>
        <button onClick={() => navigate("/admin/reports")} className="text-xs font-medium text-[#C9A227] hover:underline">← Back to Reports</button>
      </div>
    );
  }

  const { report, related, target } = data;
  const isClosed = report.status === "resolved" || report.status === "dismissed";
  const isSupport = report.targetType === "support";
  const sender = report.reporter || report.contact;
  const senderEmail = report.reporter?.email || report.contact?.email;

  return (
    <div className="max-w-4xl space-y-5">
      <button onClick={() => navigate("/admin/reports")} className="text-xs text-[#6B6B6B] hover:text-[#111111]">← Back to Reports</button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-xl font-serif text-[#111111]">Report #{shortOrderId(report._id)}</h1>
            <CopyButton text={report._id} toastMessage="Report ID copied" label="Copy report ID" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ReportTypeBadge type={report.targetType} />
            <ReportStatusBadge status={report.status} />
            <span className="text-xs text-[#6B6B6B]">Received {new Date(report.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {!isClosed && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {report.status === "open" && (
              <button onClick={handleStartReview} disabled={busy} className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] text-[#111111] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50 flex items-center gap-2">
                {busy && <Spinner size={13} />}
                Start review
              </button>
            )}
            <button onClick={() => setModal("dismissed")} disabled={busy} className="text-sm font-medium px-5 py-2.5 rounded-full border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50 transition-colors disabled:opacity-50">Dismiss</button>
            <button onClick={() => setModal("resolved")} disabled={busy} className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#111111] text-white hover:opacity-90 transition-all disabled:opacity-50">Mark resolved</button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title={isSupport ? "Message" : "Report"}>
          <p className="text-sm font-medium text-[#111111]">{REASON_LABELS[report.reason] || report.reason}</p>
          {!isSupport && <p className="text-sm text-[#6B6B6B] mt-1">About: <span className="text-[#111111]">{report.targetLabel}</span></p>}
          <p className="text-sm text-[#6B6B6B] mt-3 whitespace-pre-wrap break-words">{report.details || "No details were provided."}</p>
        </Card>

        <Card title={isSupport ? "Sender" : "Reported by"}>
          <div className="flex items-center gap-3">
            <Avatar name={sender?.name} src={report.reporter?.avatar} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111111] truncate">{sender?.name || "Unknown"}</p>
              <p className="text-xs text-[#6B6B6B] truncate">{senderEmail}</p>
              <p className="text-[11px] text-[#B0B0B0]">{report.reporter ? `${report.reporter.role} account` : "Guest (no account)"}</p>
            </div>
          </div>
          {isSupport && senderEmail && (
            <a href={`mailto:${senderEmail}?subject=${encodeURIComponent("Re: your support request")}`} className="inline-block mt-4 text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">
              Reply by email
            </a>
          )}
        </Card>
      </div>

      {!isSupport && (
        <Card title="Reported item">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#111111]">{report.targetLabel}</p>
              <p className="text-xs mt-1">
                {!target?.exists ? (
                  <span className="text-[#6B6B6B]">No longer exists</span>
                ) : target.live ? (
                  <span className="text-emerald-600">Currently visible to customers</span>
                ) : (
                  <span className="text-[#6B6B6B]">Not visible to customers right now</span>
                )}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-2">
                {related.sameTarget} other report{related.sameTarget === 1 ? "" : "s"} on this {report.targetType} · {related.sameSeller} in total against this seller
              </p>
            </div>
            <div className="flex gap-2">
              {report.targetType === "product" && report.targetProduct && (
                <Link to={`/admin/products/${report.targetProduct}`} className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Open product</Link>
              )}
              {report.targetSeller?._id && (
                <Link to={`/admin/users/${report.targetSeller._id}`} className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Open seller</Link>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#B0B0B0] mt-4">Reports never change anything automatically. Use the links above to revoke a product or suspend a seller.</p>
        </Card>
      )}

      {isClosed && (
        <Card title="Outcome">
          <p className="text-sm text-[#111111] capitalize">{report.status}{report.resolution?.by?.name ? ` by ${report.resolution.by.name}` : ""}</p>
          {report.reviewedAt && <p className="text-xs text-[#6B6B6B] mt-0.5">{new Date(report.reviewedAt).toLocaleString()}</p>}
          <p className="text-sm text-[#6B6B6B] mt-3 whitespace-pre-wrap break-words">{report.resolution?.note}</p>
        </Card>
      )}

      {report.status === "reviewing" && report.reviewedBy?.name && (
        <p className="text-xs text-[#6B6B6B]">Being reviewed by {report.reviewedBy.name}.</p>
      )}

      <NoteModal
        open={!!modal}
        busy={busy}
        title={modal === "dismissed" ? "Dismiss this report?" : "Mark this report as resolved?"}
        description={modal === "dismissed"
          ? "Use this when nothing is wrong. The reporter is told it was reviewed and no violation was found."
          : "Use this once you have taken any action needed. The reporter is told it was reviewed."}
        confirmLabel={modal === "dismissed" ? "Dismiss" : "Mark resolved"}
        danger={false}
        onConfirm={handleClose}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}