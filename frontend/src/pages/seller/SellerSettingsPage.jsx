import { useState } from "react";
import { Link } from "react-router-dom";
import { ProfileSection } from "../../components/settings/ProfileSection";
import { SecuritySection } from "../../components/settings/SecuritySection";
import { PreferencesSection } from "../../components/settings/PreferencesSection";
import { DeleteAccountSection } from "../../components/settings/DeleteAccountSection";


const TABS = ["Account", "Store Settings", "Notifications", "Security"];

const TOGGLES = [
  { key: "orders", label: "Order Notifications", description: "New orders and order changes." },
  { key: "products", label: "Product Notifications", description: "Approval decisions on your products." },
  { key: "system", label: "System Notifications", description: "Platform announcements and maintenance." },
];

const DEFAULTS = { orders: true, products: true, system: false };

export function SellerSettingsPage() {
  const [tab, setTab] = useState("Account");

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Settings</h1>

      <div className="flex gap-2 mb-8 border-b border-[#E5E5E5] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-sm px-1 pb-3 border-b-2 transition-colors duration-200 ${tab === t ? "border-[#C9A227] text-[#111111] font-medium" : "border-transparent text-[#6B6B6B]"}`}>{t}</button>
        ))}
      </div>

     {tab === "Account" && (
  <div className="max-w-lg space-y-10">
    <ProfileSection fields={["phone"]} />
    <DeleteAccountSection extraWarning="Your store, all of your products and their images will be permanently removed." />
  </div>
)}
      {tab === "Store Settings" && (
        <div className="max-w-lg border border-[#E5E5E5] rounded-2xl p-6 bg-white">
          <p className="text-sm font-medium text-[#111111] mb-1">Store details</p>
          <p className="text-xs text-[#6B6B6B] mb-4">Your store name, description, logo and contact details are managed on the Store page.</p>
          <Link to="/seller/store" className="inline-block text-sm font-medium bg-[#111111] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all">
            Go to Store page
          </Link>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="max-w-lg">
          <PreferencesSection toggles={TOGGLES} defaults={DEFAULTS} />
        </div>
      )}

      {tab === "Security" && (
        <div className="max-w-lg">
          <SecuritySection />
        </div>
      )}
    </div>
  );
}