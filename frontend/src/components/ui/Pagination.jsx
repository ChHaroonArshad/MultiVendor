function getPageNumbers(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
  const wanted = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out = [];
  wanted.forEach((n, i) => {
    if (i > 0 && n - wanted[i - 1] > 1) out.push("...");
    out.push(n);
  });
  return out;
}

export function Pagination({ page, pages, total, limit, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const btn = "min-w-8 h-8 px-2 rounded-full text-xs font-medium transition-colors";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
      <p className="text-xs text-[#6B6B6B]">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={`${btn} border border-[#E5E5E5] text-[#111111] hover:border-[#C9A227]/50 disabled:opacity-40 disabled:hover:border-[#E5E5E5]`}>
          Prev
        </button>
        {getPageNumbers(page, pages).map((n, i) =>
          n === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-xs text-[#B0B0B0]">…</span>
          ) : (
            <button key={n} onClick={() => onChange(n)} className={`${btn} ${n === page ? "bg-[#111111] text-white" : "text-[#6B6B6B] hover:bg-[#F0F0F0]"}`}>
              {n}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page >= pages} className={`${btn} border border-[#E5E5E5] text-[#111111] hover:border-[#C9A227]/50 disabled:opacity-40 disabled:hover:border-[#E5E5E5]`}>
          Next
        </button>
      </div>
    </div>
  );
}