import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { getChatStats, getMonitorConversations, getMonitorReports } from "../../services/adminChatApi";
import { AdminChatViewer } from "../../components/admin/AdminChatViewer";
import { Avatar } from "../../components/ui/Avatar";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { formatListTime, CATEGORY_LABEL } from "../../utils/chatUtils";

const LIMIT = 15;
const selectClass = "px-3 py-2 rounded-full border border-[#E5E5E5] bg-white text-xs text-[#111111] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227]";

export function AdminChatMonitorPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState("reports");
  const [reportStatus, setReportStatus] = useState("open");
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ tab: "reports", items: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: LIMIT });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(searchParams.get("c"));

  const requestRef = useRef(0);

  const fetchRows = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const res =
        tab === "reports"
          ? await getMonitorReports({ status: reportStatus, page, limit: LIMIT })
          : await getMonitorConversations({ filter, search, page, limit: LIMIT });
      if (requestId !== requestRef.current) return;
      setData({ tab, items: tab === "reports" ? res.data.reports : res.data.conversations });
      setPagination(res.data.pagination);
      setHasLoaded(true);
    } catch (err) {
      if (requestId === requestRef.current) setError(err.message || "Failed to load.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [tab, reportStatus, filter, search, page]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const fetchStats = useCallback(async () => {
    try { setStats((await getChatStats()).data.stats); } catch { /* secondary */ }
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const applySearch = useMemo(() => debounce((v) => { setSearch(v.trim()); setPage(1); }, 450), []);
  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const select = (id) => {
    setActiveId(id);
    setSearchParams(id ? { c: id } : {}, { replace: true });
  };

  const switchTab = (next) => { setTab(next); setPage(1); setHasLoaded(false); };
  const onChanged = () => { fetchRows(); fetchStats(); };

  const rows = data.tab === tab ? data.items : [];

  return (
    <div className="chat-slide-up flex bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm" style={{ height: "calc(100dvh - 9.5rem)", minHeight: 520 }}>
      <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] lg:w-[400px] shrink-0 border-r border-[#E5E5E5]`}>
        <div className="px-5 pt-5 pb-3 space-y-3">
          <h1 className="text-xl font-serif text-[#111111]">Chat monitor</h1>

          {stats && (
            <div className="grid grid-cols-3 gap-2">
              {[["Open reports", stats.openReports], ["Closed chats", stats.locked], ["Direct chats", stats.direct]].map(([label, value]) => (
                <div key={label} className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl px-3 py-2">
                  <p className="text-[10px] text-[#6B6B6B]">{label}</p>
                  <p className="text-lg font-serif text-[#111111]">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            {[["reports", "Reports"], ["conversations", "All chats"]].map(([key, label]) => (
              <button key={key} onClick={() => switchTab(key)} className={`flex-1 text-xs font-medium rounded-full py-2 transition-colors ${tab === key ? "bg-[#111111] text-white" : "border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>{label}</button>
            ))}
          </div>

          {tab === "reports" ? (
            <select value={reportStatus} onChange={(e) => { setReportStatus(e.target.value); setPage(1); }} className={`${selectClass} w-full`} aria-label="Report status">
              <option value="open">Open reports</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All reports</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); applySearch(e.target.value); }}
                placeholder="Search by name or email..."
                className="flex-1 min-w-0 px-4 py-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] focus:bg-white"
              />
              <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className={selectClass} aria-label="Filter">
                <option value="all">All</option>
                <option value="reported">Reported</option>
                <option value="locked">Closed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}
          <p className="text-[10px] text-[#B0B0B0]">Message text is never shown in this list. Opening a chat is recorded.</p>
        </div>

        <div className={`flex-1 overflow-y-auto chat-scroll px-2 pb-3 transition-opacity ${loading && hasLoaded ? "opacity-60" : ""}`} style={{ overflowAnchor: "none" }}>
          {loading && !hasLoaded && <div className="py-12 flex justify-center"><Spinner size={16} className="text-[#6B6B6B]" /></div>}
          {error && <p className="text-xs text-red-500 px-3 py-2">{error}</p>}
          {hasLoaded && !loading && rows.length === 0 && (
            <p className="text-center text-xs text-[#6B6B6B] px-6 py-12">{tab === "reports" && reportStatus === "open" ? "No open reports. You're all caught up. ✅" : "Nothing matches."}</p>
          )}

          {tab === "reports" && rows.map((r) => (
            <button key={r._id} onClick={() => select(r.conversationId)} className={`w-full text-left px-3 py-3 rounded-2xl mb-1 transition-colors ${activeId === r.conversationId ? "bg-[#FBF6E9]" : "hover:bg-[#FAFAFA]"}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] bg-red-50 text-red-600 rounded-full px-2.5 py-0.5">{CATEGORY_LABEL[r.category]}</span>
                <span className="text-[11px] text-[#B0B0B0]">{formatListTime(r.createdAt)}</span>
              </span>
              <span className="block text-sm text-[#111111] mt-1.5 truncate">{r.reporter?.name || "User"} → {r.against?.name || "User"}</span>
              {r.details && <span className="block text-xs text-[#6B6B6B] mt-0.5 line-clamp-2">“{r.details}”</span>}
              {r.status !== "open" && <span className="block text-[11px] text-[#2E7D32] mt-1 capitalize">{r.status}</span>}
            </button>
          ))}

          {tab === "conversations" && rows.map((c) => (
            <button key={c._id} onClick={() => select(c._id)} className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 transition-colors ${activeId === c._id ? "bg-[#FBF6E9]" : "hover:bg-[#FAFAFA]"}`}>
              <span className="flex -space-x-2 shrink-0">
                <Avatar name={c.customer?.name} src={c.customer?.avatar} size={34} />
                <Avatar name={c.seller?.name} src={c.seller?.avatar} size={34} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-[#111111] truncate">{c.customer?.name || "Deleted"} ↔ {c.seller?.name || "Deleted"}</span>
                <span className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[#B0B0B0]">{c.lastMessageAt ? formatListTime(c.lastMessageAt) : ""}</span>
                  {c.openReports > 0 && <span className="text-[10px] bg-red-50 text-red-600 rounded-full px-2 py-0.5">Reported</span>}
                  {c.locked && <span className="text-[10px] bg-[#FBEAEA] text-[#C0392B] rounded-full px-2 py-0.5">Closed</span>}
                  {c.blocked && <span className="text-[10px] bg-[#F0F0F0] text-[#6B6B6B] rounded-full px-2 py-0.5">Blocked</span>}
                </span>
              </span>
            </button>
          ))}

          {pagination.pages > 1 && <div className="px-2 pt-2"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onChange={setPage} /></div>}
        </div>
      </aside>

      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
        {activeId ? (
          <AdminChatViewer key={activeId} conversationId={activeId} onBack={() => select(null)} onChanged={onChanged} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#FBFAF7]">
            <div className="chat-bob w-20 h-20 rounded-3xl bg-white border border-[#E5E5E5] shadow-sm flex items-center justify-center text-4xl mb-5">🛡️</div>
            <p className="text-lg font-serif text-[#111111] mb-1">Resolve conflicts</p>
            <p className="text-sm text-[#6B6B6B] max-w-xs">Pick a report or a conversation. You can read it, message both people as mediator, close it, and record the outcome.</p>
          </div>
        )}
      </section>
    </div>
  );
}