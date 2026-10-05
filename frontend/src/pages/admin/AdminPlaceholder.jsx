export function AdminPlaceholder({ title }) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-full bg-[#FBF6E9] border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] text-lg mb-4">◐</div>
      <p className="text-sm font-medium text-[#111111] mb-1">{title}</p>
      <p className="text-xs text-[#6B6B6B]">This section is being built next.</p>
    </div>
  );
}