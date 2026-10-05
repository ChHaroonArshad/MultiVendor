// frontend/src/pages/customer/ReviewsPage.jsx
import { useState } from "react";
import { EmptyState } from "./CustomerDashboard";
import { mockReviewsPending, mockReviewsPublished } from "../../data/customerMockData";

export function ReviewsPage() {
  const [tab, setTab] = useState("pending");

  return (
    <div className="animate-fade-slide-up">
      <h1 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-6">Reviews</h1>
      <div className="flex gap-2 mb-6 border-b border-[#E5E5E5]">
        {[{ key: "pending", label: `Pending (${mockReviewsPending.length})` }, { key: "published", label: `Published (${mockReviewsPublished.length})` }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`text-sm px-1 pb-3 border-b-2 transition-colors duration-200 ${tab === t.key ? "border-[#C9A227] text-[#111111] font-medium" : "border-transparent text-[#6B6B6B]"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "pending" ? (
        mockReviewsPending.length === 0 ? (
          <EmptyState title="Nothing to review" description="Products you've purchased will show up here once delivered." />
        ) : (
          <div className="space-y-3">
            {mockReviewsPending.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border border-[#E5E5E5] rounded-2xl p-4 bg-white">
                <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111111]">{item.name}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{item.seller} · Purchased {item.purchaseDate}</p>
                </div>
                <button className="text-xs font-medium bg-[#111111] text-white px-4 py-2 rounded-full hover:opacity-90 transition-all shrink-0">Write Review</button>
              </div>
            ))}
          </div>
        )
      ) : mockReviewsPublished.length === 0 ? (
        <EmptyState title="No reviews yet" description="Your published reviews will appear here." />
      ) : (
        <div className="space-y-3">
          {mockReviewsPublished.map((r) => (
            <div key={r.id} className="border border-[#E5E5E5] rounded-2xl p-5 bg-white flex gap-4">
              <img src={r.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#C9A227] mb-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <p className="text-sm font-medium text-[#111111]">{r.title}</p>
                <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{r.text}</p>
                <p className="text-[11px] text-[#B0B0B0] mt-2">{r.date}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <button className="text-[#111111] hover:text-[#C9A227] transition-colors">Edit</button>
                  <button className="text-red-500 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}