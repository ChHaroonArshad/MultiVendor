export function SellerCard({ seller }) {
  return (
    <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="h-32 overflow-hidden bg-[#FAFAFA]">
        <img src={seller.image} alt={seller.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#111111] truncate">{seller.name}</p>
        <p className="text-xs text-[#6B6B6B] mt-0.5">{seller.category}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-[#6B6B6B]">
          <span className="text-[#C9A227]">★ {seller.rating}</span>
          <span>·</span>
          <span>{seller.products} products</span>
        </div>
        <button className="w-full mt-4 text-xs font-medium border border-[#E5E5E5] py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">
          Visit Store
        </button>
      </div>
    </div>
  );
}