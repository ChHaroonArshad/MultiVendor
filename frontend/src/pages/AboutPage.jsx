import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { SiteFooter } from "../components/marketplace/SiteFooter";
import { Reveal } from "../components/ui/Reveal";
import { CountUp } from "../components/ui/CountUp";
import { HelpIcon } from "../components/help/HelpIcon";
import { getPublicStats } from "../services/reportApi";

const VALUES = [
  { icon: "shield", title: "Trust first", text: "Buying from someone you have never met should feel safe. Every feature starts from that idea." },
  { icon: "store", title: "Fair to sellers", text: "Sellers keep control of their listings, their prices and their orders, with a dashboard built for running a shop." },
  { icon: "check", title: "Clear and honest", text: "Stock, prices and order status are always visible, so what you see is what you get." },
];

const STEPS = {
  shoppers: [
    { title: "Browse", text: "Explore products and stores from independent sellers." },
    { title: "Add to your cart", text: "Pick what you like. Your cart is saved to your account." },
    { title: "Pay securely", text: "Pay by card through Stripe, in one step for the whole cart." },
    { title: "Track your order", text: "Follow every order from processing to delivered." },
  ],
  sellers: [
    { title: "Create a seller account", text: "Sign up and choose Seller." },
    { title: "Get verified", text: "Share your identity and business details for review." },
    { title: "List your products", text: "Add photos and details. Our team reviews each product." },
    { title: "Manage your orders", text: "Ship, track and handle orders from your dashboard." },
  ],
};

const SAFETY = [
  { icon: "tag", title: "Every product is reviewed", text: "Listings go live only after our team approves them." },
  { icon: "user", title: "Sellers are verified", text: "Sellers submit identity and business details before they can list products." },
  { icon: "card", title: "Secure payments", text: "Cards are handled by Stripe. Your card details never touch our servers." },
  { icon: "package", title: "Fair refunds", text: "If a seller cancels a paid order, it is refunded to your original payment method." },
  { icon: "flag", title: "Reporting built in", text: "Flag any product or store and our team will review it." },
  { icon: "lifebuoy", title: "Help when you need it", text: "A Help Center and a support form are always one click away." },
];

export function AboutPage() {
  const [stats, setStats] = useState(null);
  const [audience, setAudience] = useState("shoppers");

  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((res) => { if (!cancelled) setStats(res.data); })
      .catch(() => {}); // the section simply stays hidden
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketplaceNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5] bg-gradient-to-b from-[#FBF6E9]/60 to-[#FAFAFA]">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-[#C9A227]/20 blur-3xl animate-blob" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 text-xs border border-[#E5E5E5] bg-white/70 rounded-full text-[#6B6B6B] mb-6 animate-fade-slide-up">About us</span>
            <h1 className="text-4xl sm:text-5xl font-serif leading-tight mb-5 animate-fade-slide-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
              A marketplace built on <span className="text-shimmer">trust.</span>
            </h1>
            <p className="text-[#6B6B6B] max-w-md mb-8 animate-fade-slide-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
              We bring independent sellers and everyday shoppers together, and we review, verify and protect every step in between.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
              <Link to="/products" className="bg-[#111111] text-white px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200">Browse products</Link>
              <Link to="/register" className="border border-[#E5E5E5] bg-white px-7 py-3 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 hover:-translate-y-0.5 transition-all duration-200">Become a seller</Link>
            </div>
          </div>

          <div className="relative h-72 sm:h-80" aria-hidden="true">
            {[
              { icon: "user", title: "Verified seller", text: "Identity checked", pos: "left-0 top-2", delay: "0s" },
              { icon: "card", title: "Secure payment", text: "Handled by Stripe", pos: "right-0 top-20", delay: "-1.5s" },
              { icon: "flag", title: "Report anything", text: "Reviewed by our team", pos: "left-8 bottom-0", delay: "-3s" },
            ].map((card) => (
              <div key={card.title} className={`absolute ${card.pos} bg-white border border-[#E5E5E5] rounded-2xl shadow-md px-5 py-4 flex items-center gap-3 animate-float`} style={{ animationDelay: card.delay }}>
                <span className="w-10 h-10 rounded-xl bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center"><HelpIcon name={card.icon} size={18} /></span>
                <span>
                  <span className="block text-sm font-medium text-[#111111]">{card.title}</span>
                  <span className="block text-xs text-[#6B6B6B]">{card.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live numbers */}
      {stats && (
        <section className="border-b border-[#E5E5E5] bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-3 gap-6 text-center">
            {[
              { label: "Products for sale", value: stats.products },
              { label: "Active stores", value: stats.stores },
              { label: "Orders delivered", value: stats.deliveredOrders },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-serif text-[#111111]"><CountUp value={s.value} /></p>
                <p className="text-xs text-[#6B6B6B] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-20">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-[#C9A227] mb-3">Our story</p>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-5">One place to sell, and one place to shop with confidence.</h2>
          <div className="space-y-4 text-[#6B6B6B] leading-relaxed max-w-2xl">
            <p>Independent sellers deserve a storefront of their own, and shoppers deserve to know who they are buying from. This marketplace brings the two together.</p>
            <p>Sellers build a store, list products and manage orders from one dashboard. Shoppers browse, compare and pay securely. In between, our team reviews products, verifies sellers and looks at every report, so trust is built into the platform instead of added on top.</p>
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 100}>
              <div className="group h-full rounded-2xl border border-[#E5E5E5] bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-[#C9A227]/40">
                <span className="w-11 h-11 rounded-xl bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"><HelpIcon name={v.icon} size={20} /></span>
                <p className="text-base font-serif text-[#111111] mb-1.5">{v.title}</p>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-20">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] text-center mb-6">How it works</h2>
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1 rounded-full border border-[#E5E5E5] bg-[#FAFAFA]">
                {[{ id: "shoppers", label: "For shoppers" }, { id: "sellers", label: "For sellers" }].map((tab) => (
                  <button key={tab.id} onClick={() => setAudience(tab.id)} className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${audience === tab.id ? "bg-[#111111] text-white shadow" : "text-[#6B6B6B] hover:text-[#111111]"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <ol key={audience} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS[audience].map((step, i) => (
              <li key={step.title} className="list-none rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 animate-fade-slide-up" style={{ animationDelay: `${i * 90}ms`, animationFillMode: "both" }}>
                <span className="w-8 h-8 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center mb-4">{i + 1}</span>
                <p className="text-sm font-medium text-[#111111] mb-1">{step.title}</p>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-[#C9A227] text-center mb-3">Built in, not bolted on</p>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] text-center mb-10">How we keep the marketplace safe</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAFETY.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 90}>
              <div className="group h-full flex gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A227]/40">
                <span className="w-10 h-10 rounded-xl bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><HelpIcon name={item.icon} size={18} /></span>
                <div>
                  <p className="text-sm font-medium text-[#111111]">{item.title}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{item.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white p-10 sm:p-14 text-center">
            <div aria-hidden="true" className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#C9A227]/15 blur-3xl animate-blob" />
            <h2 className="relative text-2xl sm:text-3xl font-serif text-[#111111] mb-2">Ready to get started?</h2>
            <p className="relative text-sm text-[#6B6B6B] mb-7">Shop with confidence, or open your own store today.</p>
            <div className="relative flex flex-wrap justify-center gap-3">
              <Link to="/products" className="bg-[#111111] text-white px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200">Browse products</Link>
              <Link to="/help" className="border border-[#E5E5E5] px-7 py-3 rounded-full text-sm font-medium text-[#111111] hover:border-[#C9A227]/50 hover:-translate-y-0.5 transition-all duration-200">Visit the Help Center</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}