import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ProfileSection } from "../../components/settings/ProfileSection";
import { SecuritySection } from "../../components/settings/SecuritySection";
import { PreferencesSection } from "../../components/settings/PreferencesSection";
import { DeleteAccountSection } from "../../components/settings/DeleteAccountSection";
const TABS = ["Profile", "Security", "Preferences", "Account"];

const TOGGLES = [
  { key: "orderNotifications", label: "Order Notifications", description: "Updates about your order status." },
  { key: "promoEmails", label: "Promotional Emails", description: "Offers, discounts and marketplace news." },
  { key: "reviewReminders", label: "Review Reminders", description: "Reminders to review recent purchases." },
  { key: "recommendations", label: "Product Recommendations", description: "Picks based on your activity." },
];

const SELECTS = [
  { key: "language", label: "Language", options: [{ value: "en", label: "English" }, { value: "ur", label: "Urdu" }, { value: "es", label: "Spanish" }] },
  { key: "currency", label: "Currency", options: [{ value: "usd", label: "USD ($)" }, { value: "eur", label: "EUR (€)" }, { value: "gbp", label: "GBP (£)" }] },
];

const DEFAULTS = { orderNotifications: true, promoEmails: false, reviewReminders: true, recommendations: true, language: "en", currency: "usd" };

export function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Profile");

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Settings</h1>

      <div className="flex gap-2 mb-8 border-b border-[#E5E5E5] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-sm px-1 pb-3 border-b-2 transition-colors duration-200 ${tab === t ? "border-[#C9A227] text-[#111111] font-medium" : "border-transparent text-[#6B6B6B]"}`}>{t}</button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="max-w-lg">
          <ProfileSection fields={["phone", "dateOfBirth", "gender"]} />
        </div>
      )}

      {tab === "Security" && (
        <div className="max-w-lg space-y-8">
          <SecuritySection />
          <div className="border-t border-[#E5E5E5] pt-6 space-y-3">
            {["Active Sessions", "Login Activity", "Two-Factor Authentication"].map((label) => (
              <div key={label} className="flex items-center justify-between p-4 border border-[#E5E5E5] rounded-2xl bg-white opacity-70">
                <p className="text-sm font-medium text-[#111111]">{label}</p>
                <span className="text-[10px] uppercase bg-[#F3F3F3] text-[#6B6B6B] px-2.5 py-1 rounded-full shrink-0">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Preferences" && (
        <div className="max-w-lg">
          <PreferencesSection toggles={TOGGLES} selects={SELECTS} defaults={DEFAULTS} />
        </div>
      )}

      {tab === "Account" && (
        <div className="max-w-lg space-y-6">
          <div className="border border-[#E5E5E5] rounded-2xl bg-white divide-y divide-[#E5E5E5]">
            {[
              ["Account Type", user?.role === "customer" ? "Customer" : user?.role],
              ["Email Verification", user?.isEmailVerified ? "Verified" : "Not verified"],
              ["Account Status", user?.status === "suspended" ? "Suspended" : "Active"],
              ["Member Since", memberSince],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-[#6B6B6B]">{label}</span>
                <span className="text-[#111111] font-medium">{value}</span>
              </div>
            ))}
          </div>

        <DeleteAccountSection />
        </div>
      )}
    </div>
  );
}