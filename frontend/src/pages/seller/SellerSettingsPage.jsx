import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const fieldClass = "w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all";

function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${checked ? "bg-[#C9A227]" : "bg-[#E5E5E5]"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export function SellerSettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Account");
  const [notifs, setNotifs] = useState({ orders: true, products: true, system: false });

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Settings</h1>
      <div className="flex gap-2 mb-8 border-b border-[#E5E5E5] overflow-x-auto">
        {["Account", "Store Settings", "Notifications", "Security"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-sm px-1 pb-3 border-b-2 transition-colors duration-200 ${tab === t ? "border-[#C9A227] text-[#111111] font-medium" : "border-transparent text-[#6B6B6B]"}`}>{t}</button>
        ))}
      </div>

      {tab === "Account" && (
        <div className="max-w-lg space-y-4">
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Name</label><input defaultValue={user?.name} className={fieldClass} /></div>
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Email</label><input defaultValue={user?.email} disabled className={fieldClass + " opacity-60"} /></div>
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Phone</label><input placeholder="+1 (555) 000-0000" className={fieldClass} /></div>
          <button className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all">Save Changes</button>
        </div>
      )}

      {tab === "Store Settings" && (
        <div className="max-w-lg space-y-4">
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Store Name</label><input defaultValue="Urban Craft Studio" className={fieldClass} /></div>
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Store Description</label><textarea rows={3} className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all resize-none" /></div>
          <button className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all">Save Changes</button>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="max-w-lg space-y-3">
          {[["orders", "Order Notifications"], ["products", "Product Notifications"], ["system", "System Notifications"]].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-4 border border-[#E5E5E5] rounded-2xl bg-white">
              <p className="text-sm font-medium text-[#111111]">{label}</p>
              <Toggle checked={notifs[key]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
            </div>
          ))}
        </div>
      )}

      {tab === "Security" && (
        <div className="max-w-lg space-y-4">
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Current password</label><input type="password" className={fieldClass} /></div>
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">New password</label><input type="password" className={fieldClass} /></div>
          <div><label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Confirm new password</label><input type="password" className={fieldClass} /></div>
          <button className="text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all">Update Password</button>
        </div>
      )}
    </div>
  );
}