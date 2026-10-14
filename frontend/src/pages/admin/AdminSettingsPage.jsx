import { useState } from "react";
import { ProfileSection } from "../../components/settings/ProfileSection";
import { SecuritySection } from "../../components/settings/SecuritySection";
import { PreferencesSection } from "../../components/settings/PreferencesSection";

const TABS = ["Account", "Security", "Notifications"];

const TOGGLES = [
  { key: "newSellerApplications", label: "New seller applications", description: "When someone registers as a seller." },
  { key: "newProductSubmissions", label: "New product submissions", description: "When a product is waiting for approval." },
  { key: "weeklySummary", label: "Weekly summary email", description: "A weekly overview of marketplace activity." },
];

const DEFAULTS = { newSellerApplications: true, newProductSubmissions: true, weeklySummary: true };

export function AdminSettingsPage() {
  const [tab, setTab] = useState("Account");

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-serif text-[#111111]">Settings</h1>
        <p className="text-sm text-[#6B6B6B]">Manage your admin account.</p>
      </div>

      <div className="flex gap-1.5 border-b border-[#E5E5E5]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-[#C9A227] text-[#111111]" : "border-transparent text-[#6B6B6B] hover:text-[#111111]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Account" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6">
          <ProfileSection />
        </div>
      )}

      {tab === "Security" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6">
          <SecuritySection />
        </div>
      )}

      {tab === "Notifications" && <PreferencesSection toggles={TOGGLES} defaults={DEFAULTS} />}
    </div>
  );
}