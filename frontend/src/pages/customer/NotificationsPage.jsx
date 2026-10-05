// frontend/src/pages/customer/NotificationsPage.jsx
import { useMemo, useState } from "react";
import { EmptyState } from "./CustomerDashboard";
import { mockNotifications } from "../../data/customerMockData";

const TABS = ["All", "Orders", "Promotions", "Reviews", "Account"];

export function NotificationsPage() {
  const [tab, setTab] = useState("All");
  const [notifications, setNotifications] = useState(mockNotifications);
  const filtered = useMemo(() => notifications.filter((n) => tab === "All" || n.category === tab.toLowerCase()), [notifications, tab]);
  const markRead = (id) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAllRead = () => setNotifications((list) => list.map((n) => ({ ...n, unread: false })));

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif text-[#111111]">Notifications</h1>
        <button onClick={markAllRead} className="text-xs text-[#C9A227] hover:underline shrink-0">Mark all as read</button>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors duration-200 ${tab === t ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C9A227]/50"}`}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors duration-200 ${n.unread ? "border-[#C9A227]/30 bg-[#FBF6E9]/40" : "border-[#E5E5E5] bg-white"}`}>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.unread ? "bg-[#C9A227]" : "bg-transparent"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111111]">{n.title}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{n.body}</p>
                <p className="text-[11px] text-[#B0B0B0] mt-1.5">{n.time}</p>
              </div>
              {n.unread && <button onClick={() => markRead(n.id)} className="text-[11px] text-[#C9A227] hover:underline shrink-0">Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}