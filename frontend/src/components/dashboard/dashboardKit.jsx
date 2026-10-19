import { Link } from "react-router-dom";
import { Icon } from "../marketplace/marketplaceUi";
import { AnimatedNumber, Sparkline } from "../charts/charts";

export const cardClass = "bg-white border border-[#E5E5E5] rounded-2xl";

export function Card({ children, className = "", delay = 0 }) {
  return (
    <div className={`${cardClass} rise-in p-4 sm:p-6 min-w-0 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#111111]">{title}</p>
        {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ChangeBadge({ value, suffix = "vs previous 7 days" }) {
  if (value == null) return <span className="text-[#9A968D]">No data to compare</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-[#2E7D32]" : "text-[#C0392B]"}>
      {up ? "↑" : "↓"} {Math.abs(value)}% {suffix}
    </span>
  );
}

export function StatCard({ label, value, format, sub, change, changeSuffix, icon, spark, delay = 0, to, highlight = false }) {
  const body = (
    <div
      className={`h-full ${cardClass} rise-in p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${highlight ? "border-[#C9A227]/60 bg-[#FFFDF6]" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-[#6B6B6B]">{label}</p>
        {icon && (
          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${highlight ? "bg-[#C9A227] text-white pulse-ring" : "bg-[#FBF6E9] text-[#C9A227]"}`}>
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-serif text-[#111111] leading-none mb-1.5 truncate">
        <AnimatedNumber value={value} format={format} />
      </p>
      {sub && <p className="text-[11px] text-[#6B6B6B] leading-snug">{sub}</p>}
      {change !== undefined && <p className="text-[11px] font-medium mt-1 leading-snug"><ChangeBadge value={change} suffix={changeSuffix} /></p>}
      {spark && <div className="mt-3 -mx-1"><Sparkline values={spark} /></div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/40 rounded-2xl">{body}</Link> : body;
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center px-4">
      <p className="text-sm text-red-600 mb-3">{message}</p>
      <button onClick={onRetry} className="text-xs font-medium border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">Try Again</button>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="space-y-5 animate-pulse">
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${cardClass} h-32`} />)}
      </div>
      <div className="grid xl:grid-cols-3 gap-5">
        <div className={`${cardClass} h-72 xl:col-span-2`} />
        <div className={`${cardClass} h-72`} />
      </div>
      <div className={`${cardClass} h-56`} />
    </div>
  );
}