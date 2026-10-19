import { useEffect, useId, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SmartImage } from "../marketplace/marketplaceUi";

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function smoothPath(points) {
  return points.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const mid = (prev.x + p.x) / 2;
    return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}

// Flips to true shortly after first paint so CSS transitions have a start state to animate from.
function useMounted(delay = 60) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(reduced);
  useEffect(() => {
    if (reduced) { setMounted(true); return undefined; }
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [reduced, delay]);
  return mounted;
}

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString(), duration = 900 }) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) { setDisplay(value); return undefined; }
    let raf;
    let from = 0;
    setDisplay((current) => { from = current; return current; });
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <>{format(display)}</>;
}

export function Sparkline({ values, color = "#C9A227" }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * 100, y: 88 - (v / max) * 76 }));
  const d = smoothPath(pts);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-reveal w-full h-10" aria-hidden="true">
      <path d={`${d} L 100 100 L 0 100 Z`} fill={color} fillOpacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* data: [{ key, label, title, value, detail }] */
export function TrendChart({ data, formatValue, formatTick = (v) => compactNumber.format(v), detailLabel = "orders", variant = "area", color = "#C9A227" }) {
  const gradientId = useId().replace(/:/g, "");
  const mounted = useMounted();
  const [hover, setHover] = useState(null);

  const n = data.length;
  if (n === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1); // never divide by zero on a quiet period
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const xPad = variant === "bars" ? 8 : 5;
  const xOf = (i) => (n > 1 ? xPad + (i * (100 - xPad * 2)) / (n - 1) : 50);
  const yOf = (v) => 88 - (v / max) * 72;
  const step = n > 1 ? (100 - xPad * 2) / (n - 1) : 100;

  const points = data.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.value) }));
  const line = smoothPath(points);
  const area = `${line} L ${points[n - 1].x} 88 L ${points[0].x} 88 Z`;
  const ticks = [0, 1, 2, 3].map((i) => (max * i) / 3);
  const active = hover != null ? points[hover] : null;
  const labelEvery = n > 14 ? Math.ceil(n / 7) : 1;
  const showDots = variant === "area" && n <= 14;
  const detailText = (count) => `${count} ${count === 1 ? detailLabel.replace(/s$/, "") : detailLabel}`;

  return (
    <div>
      <div className="relative h-44 sm:h-52 ml-10 mr-1 sm:mr-2">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-[#EEEBE4]" style={{ top: `${yOf(t)}%` }}>
            <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[10px] text-[#9A968D]">{formatTick(t)}</span>
          </div>
        ))}

        {variant === "area" && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-reveal absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}

        {variant === "bars" &&
          points.map((p, i) => (
            <div
              key={p.key}
              className="absolute -translate-x-1/2 rounded-t-lg transition-all duration-700 ease-out pointer-events-none"
              style={{
                left: `${p.x}%`,
                width: `${Math.min(step * 0.55, 12)}%`,
                top: `${mounted ? p.y : 88}%`,
                height: `${mounted ? (p.value > 0 ? Math.max(88 - p.y, 1.5) : 0) : 0}%`,
                transitionDelay: `${i * 70}ms`,
                background: hover === i ? color : `${color}99`,
              }}
            />
          ))}

        {active && <div className="absolute top-0 bottom-0 w-px bg-[#C9A227]/40 pointer-events-none" style={{ left: `${active.x}%` }} />}

        {showDots &&
          points.map((p, i) => (
            <span
              key={p.key}
              className="chart-dot absolute w-2 h-2 rounded-full bg-[#111111] pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.12}s` }}
            />
          ))}

        {active && variant === "area" && (
          <span className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 shadow pointer-events-none" style={{ left: `${active.x}%`, top: `${active.y}%`, borderColor: color }} />
        )}

        {points.map((p, i) => {
          const left = Math.max(0, p.x - step / 2);
          const right = Math.min(100, p.x + step / 2);
          return (
            <button
              key={p.key}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${p.title}: ${formatValue(p.value)}, ${detailText(p.detail)}`}
              className="absolute top-0 bottom-0 cursor-crosshair focus-visible:outline-none"
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          );
        })}

        {active && (
          <div className="absolute z-10 -translate-x-1/2 -translate-y-full pb-3 pointer-events-none" style={{ left: `${Math.min(Math.max(active.x, 16), 84)}%`, top: `${active.y}%` }}>
            <div className="chart-tip relative bg-white border border-[#E8E5DF] rounded-xl shadow-lg px-3.5 py-2.5 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wide text-[#9A968D] whitespace-nowrap">{active.title}</p>
              <p className="font-serif text-lg text-[#111111] leading-tight mt-0.5 whitespace-nowrap">{formatValue(active.value)}</p>
              <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {detailText(active.detail)}
              </p>
              <span className="absolute left-1/2 -bottom-1 w-2 h-2 -translate-x-1/2 rotate-45 bg-white border-r border-b border-[#E8E5DF]" />
            </div>
          </div>
        )}
      </div>

      <div className="relative h-5 mt-2 ml-10 mr-1 sm:mr-2">
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <span key={p.key} className="absolute -translate-x-1/2 text-[10px] text-[#9A968D] whitespace-nowrap" style={{ left: `${p.x}%` }}>{p.label}</span>
          ) : null
        )}
      </div>

      {total === 0 && <p className="text-xs text-[#6B6B6B] text-center mt-3">Nothing to show for this period yet.</p>}
    </div>
  );
}

/* segments: [{ label, value, color }] */
export function DonutChart({ segments, centerLabel = "Total" }) {
  const mounted = useMounted();
  const [hover, setHover] = useState(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 38;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const arcs = segments.map((s) => {
    const len = total > 0 ? (s.value / total) * C : 0;
    const arc = { ...s, len, offset };
    offset += len;
    return arc;
  });

  const active = hover !== null ? arcs[hover] : null;

  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-[minmax(0,1fr)] min-[520px]:grid-cols-[auto_minmax(0,1fr)] items-center gap-5 sm:gap-6 w-full min-w-0 py-2">

      {/* Donut: fixed size, never shrinks */}
      <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 mx-auto">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`${centerLabel}: ${total}`}
        >
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="#F0EEE9"
            strokeWidth="10"
          />

          {total > 0 &&
            arcs.map((a, i) =>
              a.value > 0 ? (
                <circle
                  key={a.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={hover === i ? 13 : 10}
                  strokeDasharray={`${mounted ? Math.max(a.len - 0.8, 0) : 0} ${C}`}
                  strokeDashoffset={-a.offset}
                  strokeLinecap="butt"
                  className="cursor-pointer"
                  style={{
                    transition:
                      "stroke-dasharray 0.9s ease-out, stroke-width 0.2s ease",
                    transitionDelay: `${i * 0.1}s`,
                  }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              ) : null
            )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-serif text-2xl text-[#111111] leading-none">
            {active ? active.value : total}
          </p>
          <p className="text-[10px] text-[#9A968D] mt-1 capitalize">
            {active ? active.label : centerLabel}
          </p>
        </div>
      </div>

      {/* Legend: flexible width and safe text wrapping */}
      <ul className="w-full min-w-0 space-y-2">
        {arcs.map((a, i) => (
          <li
            key={a.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 text-xs transition-colors ${
              hover === i ? "bg-[#FAF9F6]" : ""
            }`}
          >
            <span className="flex items-center gap-2 min-w-0 text-[#4B5260] capitalize">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: a.color }}
              />
              <span className="truncate">{a.label}</span>
            </span>

            <span className="flex items-center justify-end gap-1.5 text-[#111111] font-medium tabular-nums whitespace-nowrap">
              <span>{a.value}</span>
              {total > 0 && (
                <span className="text-[#9A968D] font-normal">
                  {Math.round((a.value / total) * 100)}%
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* items: [{ key, label, value, valueLabel, sub, image }] */
export function BarList({ items, color = "#C9A227" }) {
  const mounted = useMounted();
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-4">
      {items.map((it, idx) => (
        <li key={it.key} className="rise-in" style={{ animationDelay: `${idx * 80}ms` }}>
          <div className="flex items-center gap-3 mb-1.5">
            {it.image !== undefined && (
              <div className="w-9 h-9 rounded-lg bg-[#F6F4F0] overflow-hidden shrink-0">
                <SmartImage src={it.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#111111] truncate">{it.label}</p>
              {it.sub && <p className="text-[11px] text-[#9A968D]">{it.sub}</p>}
            </div>
            <p className="text-xs font-medium text-[#111111] shrink-0">{it.valueLabel}</p>
          </div>
          <div className="h-1.5 rounded-full bg-[#F0EEE9] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: mounted ? `${(it.value / max) * 100}%` : "0%", background: color, transitionDelay: `${idx * 100}ms` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}