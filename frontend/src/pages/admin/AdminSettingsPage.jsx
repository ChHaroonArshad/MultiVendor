import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const TABS = ["Account", "Security", "Notifications"];

export function AdminSettingsPage() {
  const { user } = useAuth();
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
            key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-[#C9A227] text-[#111111]" : "border-transparent text-[#6B6B6B] hover:text-[#111111]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Account" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1.5">Full Name</label>
            <input type="text" defaultValue={user?.name || ""} className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
          </div>
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1.5">Email</label>
            <input type="email" defaultValue={user?.email || ""} disabled className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#F0F0F0] text-sm text-[#6B6B6B] cursor-not-allowed" />
          </div>
          <button className="bg-[#111111] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">Save Changes</button>
        </div>
      )}

      {tab === "Security" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1.5">Current Password</label>
            <input type="password" className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
          </div>
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1.5">New Password</label>
            <input type="password" className="w-full px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all" />
          </div>
          <button className="bg-[#111111] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-200">Update Password</button>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 space-y-4">
          {["New seller applications", "New product submissions", "Weekly summary email"].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <p className="text-sm text-[#111111]">{label}</p>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#C9A227]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}