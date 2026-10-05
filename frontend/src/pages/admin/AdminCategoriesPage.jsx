import { useState } from "react";
import { adminCategories } from "../../data/adminDashboardData";

export function AdminCategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif text-[#111111]">Categories</h1>
          <p className="text-sm text-[#6B6B6B]">Manage the categories shown across the marketplace.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-[#111111] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {adminCategories.map((c) => (
          <div key={c.id} className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
            <div className="h-24 bg-[#FAFAFA]"><img src={c.image} alt={c.name} className="w-full h-full object-cover" /></div>
            <div className="p-4">
              <p className="text-sm font-medium text-[#111111]">{c.name}</p>
              <p className="text-[11px] text-[#B0B0B0] mb-3">{c.products.toLocaleString()} products</p>
              <div className="flex gap-1.5">
                <button className="flex-1 text-xs font-medium border border-[#E5E5E5] py-1.5 rounded-full hover:border-[#C9A227]/50 transition-colors">Edit</button>
                <button className="flex-1 text-xs font-medium border border-[#E5E5E5] text-[#C0392B] py-1.5 rounded-full hover:border-[#C0392B]/50 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-slide-up" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E5E5] p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-[#111111] mb-4">Add Category</p>
            <input type="text" placeholder="Category name" className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all mb-4" />
            <div className="flex flex-col gap-2">
              <button className="w-full bg-[#111111] text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">Add</button>
              <button onClick={() => setModalOpen(false)} className="w-full border border-[#E5E5E5] py-2.5 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}