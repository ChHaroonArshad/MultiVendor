import { useState } from "react";
import { storeInfo } from "../../data/sellerDashboardData";

const fieldClass = "w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

export function SellerStorePage() {
  const [form, setForm] = useState(storeInfo);

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Store</h1>
      <p className="text-sm text-[#6B6B6B] mb-8">Manage how your store appears to customers.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 bg-white space-y-5">
          <div className="flex items-center gap-4">
            <img src={form.logo} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            <button className="text-xs font-medium border border-[#E5E5E5] px-4 py-2 rounded-full hover:border-[#C9A227]/50 transition-colors">Change Logo</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Store Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Store Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Status</label>
              <div className="px-4 py-2.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm capitalize">{form.status}</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Contact Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <button className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all">Edit Store</button>
        </div>

        <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white h-fit">
          <img src={form.banner} alt="" className="w-full h-32 object-cover" />
          <div className="p-5">
            <div className="flex items-center gap-3 -mt-10 mb-3">
              <img src={form.logo} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow" />
            </div>
            <p className="text-sm font-medium text-[#111111]">{form.name}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{form.description}</p>
            <button className="w-full mt-4 text-xs font-medium border border-[#E5E5E5] py-2.5 rounded-full hover:border-[#C9A227]/50 transition-colors">View Public Store</button>
          </div>
        </div>
      </div>
    </div>
  );
}