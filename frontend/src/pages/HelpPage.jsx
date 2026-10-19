import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MarketplaceNavbar } from "../components/marketplace/MarketplaceNavbar";
import { SiteFooter } from "../components/marketplace/SiteFooter";
import { Reveal } from "../components/ui/Reveal";
import { HelpIcon } from "../components/help/HelpIcon";
import { SupportForm } from "../components/help/SupportForm";
import { FlagIcon } from "../components/icons/FlagIcon";
import { HELP_CATEGORIES, FAQS, SUPPORT_RESPONSE_TIME } from "../data/helpContent";

const SUGGESTIONS = [
  { label: "Track my order", query: "track" },
  { label: "Refunds", query: "refund" },
  { label: "Reset password", query: "password" },
  { label: "Become a seller", query: "seller" },
  { label: "Report a product", query: "report" },
];

const REPORT_STEPS = [
  { n: 1, title: "Tap the flag", text: "It's on every product page and store page." },
  { n: 2, title: "Choose a reason", text: "Add details so our team can see what's wrong." },
  { n: 3, title: "We review it", text: "You get a notification when the review is done." },
];

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function FaqItem({ item, open, onToggle, index }) {
  return (
    <div className="animate-fade-slide-up" style={{ animationDelay: `${Math.min(index, 8) * 45}ms`, animationFillMode: "both" }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left hover:bg-[#FAFAFA] transition-colors">
        <span className={`text-sm sm:text-[15px] transition-colors ${open ? "text-[#111111] font-medium" : "text-[#111111]"}`}>{item.q}</span>
        <span className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${open ? "bg-[#111111] border-[#111111] text-white rotate-180" : "border-[#E5E5E5] text-[#6B6B6B]"}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5">
            <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">{item.a}</p>
            {item.link && (
              <Link to={item.link.to} className="inline-block mt-3 text-xs font-medium text-[#C9A227] hover:underline">{item.link.label} →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpPage() {
  const { hash } = useLocation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => scrollToId(hash.slice(1)), 150);
    return () => clearTimeout(timer);
  }, [hash]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) => (category === "all" || f.category === category) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  }, [query, category]);

  const handleQueryChange = (value) => {
    setQuery(value);
    if (value) setCategory("all"); // a search should look everywhere
    setOpenId(null);
  };

  const pickCategory = (id) => {
    setCategory((current) => (current === id ? "all" : id));
    setQuery("");
    setOpenId(null);
    setTimeout(() => scrollToId("faq"), 60);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketplaceNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5] bg-gradient-to-b from-[#FBF6E9]/70 to-[#FAFAFA]">
        <div aria-hidden="true" className="pointer-events-none absolute -top-28 -left-24 w-96 h-96 rounded-full bg-[#C9A227]/25 blur-3xl animate-blob" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-[#111111]/[0.06] blur-3xl animate-blob" style={{ animationDelay: "-7s" }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs border border-[#E5E5E5] bg-white/70 backdrop-blur rounded-full text-[#6B6B6B] mb-6 animate-fade-slide-up">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-ring-pulse" />
            Help Center
          </span>

          <h1 className="text-4xl sm:text-5xl font-serif leading-tight mb-4 animate-fade-slide-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <span className="text-shimmer">How can we help you today?</span>
          </h1>
          <p className="text-[#6B6B6B] mb-8 max-w-lg mx-auto animate-fade-slide-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
            Search our answers, or send us a message. We read every one.
          </p>

          <div className="relative max-w-xl mx-auto animate-fade-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#B0B0B0]"><HelpIcon name="search" size={18} /></span>
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search for answers, e.g. refund, password, tracking"
              aria-label="Search help articles"
              className="w-full pl-12 pr-5 py-4 rounded-full border border-[#E5E5E5] bg-white text-sm shadow-sm placeholder:text-[#B0B0B0] focus:outline-none focus:ring-4 focus:ring-[#C9A227]/15 focus:border-[#C9A227] transition-all duration-300"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-5 animate-fade-slide-up" style={{ animationDelay: "320ms", animationFillMode: "both" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => { handleQueryChange(s.query); setTimeout(() => scrollToId("faq"), 60); }}
                className="text-xs px-3.5 py-1.5 rounded-full border border-[#E5E5E5] bg-white/80 text-[#6B6B6B] hover:border-[#C9A227] hover:text-[#111111] hover:-translate-y-0.5 transition-all duration-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 -mt-8 relative">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {HELP_CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={i * 70}>
              <button
                onClick={() => pickCategory(c.id)}
                className={`group w-full h-full text-left rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md ${category === c.id ? "border-[#C9A227] ring-2 ring-[#C9A227]/20" : "border-[#E5E5E5] hover:border-[#C9A227]/50"}`}
              >
                <span className="w-10 h-10 rounded-xl bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <HelpIcon name={c.icon} size={20} />
                </span>
                <span className="block text-sm font-medium text-[#111111]">{c.title}</span>
                <span className="block text-xs text-[#6B6B6B] mt-1">{c.blurb}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-8 py-16 scroll-mt-24">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-1">Frequently asked questions</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">
            {query ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"` : "Quick answers to the things people ask most."}
          </p>
        </Reveal>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {[{ id: "all", title: "All" }, ...HELP_CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.id); setOpenId(null); }}
              className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-all duration-200 ${category === c.id ? "bg-[#111111] text-white border-[#111111]" : "border-[#E5E5E5] bg-white text-[#6B6B6B] hover:border-[#C9A227]/50"}`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden divide-y divide-[#F0F0F0]">
            {results.map((item, i) => (
              <FaqItem key={item.id} item={item} index={i} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#E5E5E5] rounded-2xl bg-white py-14 text-center animate-fade-slide-up">
            <p className="text-sm font-medium text-[#111111] mb-1">No answers match that</p>
            <p className="text-xs text-[#6B6B6B] mb-4">Try a different word, or ask us directly.</p>
            <button onClick={() => scrollToId("contact")} className="text-xs font-medium bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all">Contact support</button>
          </div>
        )}
      </section>

      {/* Safety and reporting */}
      <section id="safety" className="max-w-4xl mx-auto px-4 sm:px-8 pb-16 scroll-mt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-[#C9A227]/30 bg-gradient-to-br from-[#FBF6E9] to-white p-6 sm:p-10">
            <div className="flex items-start gap-5">
              <span className="w-14 h-14 rounded-2xl bg-white border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center shrink-0 animate-ring-pulse">
                <FlagIcon size={24} className="animate-flag-wave" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-[#111111] mb-1">See something wrong? Report it.</h2>
                <p className="text-sm text-[#6B6B6B] max-w-xl">
                  If a product or a store looks fake, misleading or unsafe, flag it. Reports are only visible to our team, and the seller is never told who sent one.
                </p>
              </div>
            </div>

            <ol className="grid sm:grid-cols-3 gap-4 mt-8">
              {REPORT_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 120}>
                  <li className="list-none h-full rounded-2xl bg-white/80 border border-[#E5E5E5] p-4">
                    <span className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center mb-3">{step.n}</span>
                    <p className="text-sm font-medium text-[#111111]">{step.title}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">{step.text}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-[#E5E5E5] bg-white scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 grid lg:grid-cols-5 gap-10">
          <Reveal className="lg:col-span-2">
            <span className="w-12 h-12 rounded-2xl bg-[#FBF6E9] text-[#C9A227] flex items-center justify-center mb-5"><HelpIcon name="lifebuoy" size={22} className="animate-blob" /></span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#111111] mb-2">Still need help?</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">Send us a message and a real person will read it.{SUPPORT_RESPONSE_TIME ? ` We usually reply within ${SUPPORT_RESPONSE_TIME}.` : ""}</p>
            <ul className="space-y-3">
              {["Your order ID, if it's about an order", "What you expected and what happened", "The email on your account, if you're signed out"].map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm text-[#6B6B6B]">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><HelpIcon name="check" size={12} /></span>
                  {tip}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-3">
            <div className="border border-[#E5E5E5] rounded-3xl bg-white p-6 sm:p-8 shadow-sm">
              <SupportForm />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}