import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import { getAdminReports, getAdminReportStats } from "../../services/adminReportApi";
import { ReportStatusBadge, ReportTypeBadge } from "../../components/reports/ReportBadges";
import { FlagIcon } from "../../components/icons/FlagIcon";
import { Avatar } from "../../components/ui/Avatar";
import { CopyButton } from "../../components/ui/CopyButton";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { shortOrderId } from "../../utils/orderUtils";
import { REASON_LABELS } from "../../data/reportOptions";

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: "active", label: "Needs attention" },
  { value: "open", label: "Open" },
  { value: "reviewing", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All reports" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "product", label: "Products" },
  { value: "store", label: "Stores" },
  { value: "support", label: "Support requests" },
];

const selectClass =
  "px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function AdminReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const requestIdRef = useRef(0);

  const fetchReports = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getAdminReports({ page, limit: LIMIT, status, type, search });
      if (requestId !== requestIdRef.current) return;
      if (res.data.reports.length === 0 && page > 1) {
        setPage(res.data.pagination.pages);
        return;
      }
      setReports(res.data.reports);
      setPagination(res.data.pagination);
      setHasLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load reports.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, status, type, search]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    let cancelled = false;
    getAdminReportStats()
      .then((res) => { if (!cancelled) setStats(res.data.stats); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const applySearch = useMemo(() => debounce((value) => { setSearch(value); setPage(1); }, 400), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    applySearch(e.target.value);
  };

  const clearSearch = () => {
    applySearch.cancel();
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const hasFilters = status !== "active" || type !== "all" || search !== "";
  const statCards = stats
    ? [
        { label: "Open", value: stats.open },
        { label: "In review", value: stats.reviewing },
        { label: "Resolved", value: stats.resolved },
        { label: "Dismissed", value: stats.dismissed },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><FlagIcon size={18} /></span>
        <div>
          <h1 className="text-xl font-serif text-[#111111]">Reports</h1>
          <p className="text-sm text-[#6B6B6B]">Reports about products and stores, and messages from the Help page.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="border border-[#E5E5E5] rounded-2xl p-4 bg-white">
              <p className="text-xs text-[#6B6B6B] mb-1">{s.label}</p>
              <p className="text-xl font-serif text-[#111111]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by product, store, reporter or email"
            className="w-full pl-4 pr-9 py-2.5 rounded-full border border-[#E5E5E5] bg-white text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all"
          />
          {searchInput && (
            <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0B0B0] hover:text-[#111111]">✕</button>
          )}
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className={`${selectClass} lg:w-48`}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by type" className={`${selectClass} lg:w-48`}>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && !hasLoaded && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 flex items-center justify-center gap-2">
          <Spinner size={16} className="text-[#6B6B6B]" />
          <p className="text-sm text-[#6B6B6B]">Loading reports...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-2xl py-10 text-center px-4">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchReports} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try again</button>
        </div>
      )}

      {hasLoaded && !error && reports.length === 0 && (
        <div className="border border-[#E5E5E5] rounded-2xl bg-white py-16 text-center">
          <p className="text-sm text-[#6B6B6B]">{hasFilters ? "No reports match your filters." : "Nothing needs your attention. All clear."}</p>
          {hasFilters && (
            <button onClick={() => { clearSearch(); setStatus("active"); setType("all"); }} className="text-xs font-medium text-[#C9A227] hover:underline mt-2">Reset filters</button>
          )}
        </div>
      )}

      {hasLoaded && !error && reports.length > 0 && (
        <div className="space-y-4">
          <div className={`bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#B0B0B0] border-b border-[#E5E5E5]">
                    <th className="py-3 px-5 font-medium">Report</th>
                    <th className="py-3 px-3 font-medium">Type</th>
                    <th className="py-3 px-3 font-medium">About</th>
                    <th className="py-3 px-3 font-medium">Reason</th>
                    <th className="py-3 px-3 font-medium">From</th>
                    <th className="py-3 px-3 font-medium">Date</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/admin/reports/${r._id}`)} className="font-medium text-[#111111] hover:text-[#C9A227] transition-colors">#{shortOrderId(r._id)}</button>
                          <CopyButton text={r._id} toastMessage="Report ID copied" label="Copy report ID" />
                        </div>
                      </td>
                      <td className="py-3 px-3"><ReportTypeBadge type={r.targetType} /></td>
                      <td className="py-3 px-3 text-[#111111]"><p className="truncate max-w-[200px]">{r.targetType === "support" ? "Support request" : r.targetLabel}</p></td>
                      <td className="py-3 px-3 text-[#6B6B6B] whitespace-nowrap">{REASON_LABELS[r.reason] || r.reason}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-[150px]">
                          <Avatar name={r.reporter?.name || r.contact?.name} src={r.reporter?.avatar} size={28} />
                          <p className="text-sm text-[#111111] truncate max-w-[130px]">{r.reporter?.name || r.contact?.name || "Guest"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6B6B6B] whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><ReportStatusBadge status={r.status} /></td>
                      <td className="py-3 px-5 text-right">
                        <button onClick={() => navigate(`/admin/reports/${r._id}`)} className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#E5E5E5] text-[#111111] hover:border-[#C9A227]/50 transition-colors">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} />
        </div>
      )}
    </div>
  );
}