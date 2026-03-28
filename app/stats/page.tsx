"use client";

import { useState } from "react";
import { burnoutTrend, thirtyDayMood, weeklyWalkCounts } from "@/lib/mock-data";

type Range = 7 | 14 | 30;

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 5;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 5;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 5;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 5;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function MoodLineChart({ range, showBefore, onToggleBefore, showAfter, onToggleAfter }: {
  range: Range; showBefore: boolean; onToggleBefore: () => void; showAfter: boolean; onToggleAfter: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = thirtyDayMood.slice(-range);
  const W = 680, H = 200;
  const pad = { l: 32, r: 16, t: 24, b: 28 };
  const pw  = W - pad.l - pad.r;
  const ph  = H - pad.t - pad.b;
  const n   = data.length;
  const xPos = (i: number) => pad.l + (i / Math.max(n - 1, 1)) * pw;
  const yPos = (v: number) => pad.t + (1 - (v - 1) / 4) * ph;
  const baseY = yPos(1);
  const beforePts = data.map((p, i) => [xPos(i), yPos(p.before)] as [number, number]);
  const afterPts  = data.map((p, i) => [xPos(i), yPos(p.after)]  as [number, number]);
  const beforeD = smoothPath(beforePts);
  const afterD  = smoothPath(afterPts);
  const beforeArea = `${beforeD} L ${xPos(n - 1)},${baseY} L ${pad.l},${baseY} Z`;
  const afterArea  = `${afterD}  L ${xPos(n - 1)},${baseY} L ${pad.l},${baseY} Z`;
  const stride = Math.max(1, Math.floor(n / 5));
  const hovP = hovered !== null ? data[hovered] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ cursor: "crosshair" }}>
        <defs>
          <linearGradient id="gradBefore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6367FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6367FF" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradAfter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C9BEFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9BEFF" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={yPos(v)} x2={W - pad.r} y2={yPos(v)}
              stroke="var(--border)" strokeWidth={v === 1 || v === 5 ? 1 : 0.5}
              strokeDasharray={v === 1 || v === 5 ? "" : "3 4"} />
            <text x={pad.l - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10"
              fill="var(--fg-muted)" fontFamily="var(--font-body)">{v}</text>
          </g>
        ))}
        {showAfter  && <path d={afterArea}  fill="url(#gradAfter)"  />}
        {showBefore && <path d={beforeArea} fill="url(#gradBefore)" />}
        {showAfter  && <path d={afterD}  fill="none" stroke="#C9BEFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {showBefore && <path d={beforeD} fill="none" stroke="#6367FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {data.map((p, i) => {
          const x  = xPos(i);
          const yB = yPos(p.before);
          const yA = yPos(p.after);
          const isLabel = i % stride === 0 || i === n - 1;
          const isHov   = hovered === i;
          return (
            <g key={i}>
              {isLabel && (
                <>
                  {showBefore && <><circle cx={x} cy={yB} r="3.5" fill="#6367FF" /><text x={x} y={yB - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6367FF" fontFamily="var(--font-body)">{p.before}</text></>}
                  {showAfter  && <><circle cx={x} cy={yA} r="3.5" fill="#C9BEFF" /><text x={x} y={yA - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#C9BEFF" fontFamily="var(--font-body)">{p.after}</text></>}
                  <text x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-muted)" fontFamily="var(--font-body)">{p.day.replace(/\D+/, "")}</text>
                </>
              )}
              <rect x={x - (pw / n) / 2} y={pad.t} width={pw / n} height={ph} fill="transparent" style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
              {isHov && (
                <g>
                  <line x1={x} y1={pad.t} x2={x} y2={baseY} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                  {showBefore && <><circle cx={x} cy={yB} r="5" fill="#6367FF" opacity="0.9" /><circle cx={x} cy={yB} r="9" fill="#6367FF" opacity="0.15" /></>}
                  {showAfter  && <><circle cx={x} cy={yA} r="5" fill="#C9BEFF" opacity="0.9" /><circle cx={x} cy={yA} r="9" fill="#C9BEFF" opacity="0.15" /></>}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="h-8 flex items-center justify-center gap-6 text-xs" style={{ color: "var(--fg-muted)" }}>
        {hovP ? (
          <>
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{hovP.day}</span>
            {showBefore && <span>Before: <b style={{ color: "#6367FF" }}>{hovP.before}</b></span>}
            {showAfter  && <span>After: <b style={{ color: "#C9BEFF" }}>{hovP.after}</b></span>}
            {showBefore && showAfter && <span>Lift: <b style={{ color: "#22c55e" }}>+{(hovP.after - hovP.before).toFixed(1)}</b></span>}
          </>
        ) : <span>Hover over the chart to inspect values</span>}
      </div>
      <div className="mt-1 flex justify-center gap-4">
        <button type="button" onClick={onToggleBefore}
          className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: showBefore ? "rgba(99,103,255,0.12)" : "var(--primary-dim)", color: showBefore ? "#6367FF" : "var(--fg-muted)", border: `1px solid ${showBefore ? "rgba(99,103,255,0.3)" : "var(--border)"}`, opacity: showBefore ? 1 : 0.5 }}>
          <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: "#6367FF" }} />Before walk
        </button>
        <button type="button" onClick={onToggleAfter}
          className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: showAfter ? "rgba(201,190,255,0.15)" : "var(--primary-dim)", color: showAfter ? "#8b7fd4" : "var(--fg-muted)", border: `1px solid ${showAfter ? "rgba(201,190,255,0.4)" : "var(--border)"}`, opacity: showAfter ? 1 : 0.5 }}>
          <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: "#C9BEFF" }} />After walk
        </button>
      </div>
    </div>
  );
}

function WeeklyBarChart({ activeWeek, onSelect }: { activeWeek: number | null; onSelect: (i: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxCount = Math.max(...weeklyWalkCounts.map(w => w.count));
  const W = 340, H = 160, barW = 54, gap = 28;
  const total  = weeklyWalkCounts.length * barW + (weeklyWalkCounts.length - 1) * gap;
  const startX = (W - total) / 2;
  const maxH   = 96;
  const baseY  = H - 30;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6367FF" stopOpacity="1" /><stop offset="100%" stopColor="#8494FF" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barGradDim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8494FF" stopOpacity="0.4" /><stop offset="100%" stopColor="#C9BEFF" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9BEFF" stopOpacity="1" /><stop offset="100%" stopColor="#8494FF" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <line x1={startX - 4} y1={baseY} x2={startX + total + 4} y2={baseY} stroke="var(--border)" strokeWidth="1" />
      {weeklyWalkCounts.map((w, i) => {
        const barH   = (w.count / maxCount) * maxH;
        const x      = startX + i * (barW + gap);
        const y      = baseY - barH;
        const isPeak = w.count === maxCount;
        const isHov  = hovered === i;
        const isSel  = activeWeek === i;
        const fill   = isSel ? "url(#barGradActive)" : isPeak ? "url(#barGrad)" : "url(#barGradDim)";
        const labelColor = isSel ? "#C9BEFF" : isPeak ? "#6367FF" : "var(--fg-muted)";
        return (
          <g key={i} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onClick={() => onSelect(i)}>
            {(isHov || isSel) && <rect x={x - 3} y={y - 3} width={barW + 6} height={barH + 6} rx="10" fill="rgba(99,103,255,0.08)" />}
            <rect x={x + 2} y={y + 3} width={barW} height={barH} rx="8" fill="rgba(99,103,255,0.08)" />
            <rect x={x} y={y} width={barW} height={barH} rx="8" fill={fill} style={{ transition: "fill 0.2s" }} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="14" fontWeight="700" fill={labelColor} fontFamily="var(--font-body)">{w.count}</text>
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={isSel ? "var(--fg)" : "var(--fg-muted)"} fontFamily="var(--font-body)">{w.week}</text>
            {isSel && <circle cx={x + barW / 2} cy={baseY + 10} r="3" fill="#C9BEFF" />}
          </g>
        );
      })}
    </svg>
  );
}

function BurnoutSparkline() {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 680, H = 110;
  const pad = { l: 16, r: 16, t: 20, b: 16 };
  const pw  = W - pad.l - pad.r;
  const ph  = H - pad.t - pad.b;
  const n   = burnoutTrend.length;
  const xPos = (i: number) => pad.l + (i / (n - 1)) * pw;
  const yPos = (v: number) => pad.t + (1 - (v - 1) / 4) * ph;
  const baseY = yPos(1);
  const pts   = burnoutTrend.map((p, i) => [xPos(i), yPos(p.score)] as [number, number]);
  const lineD = smoothPath(pts);
  const areaD = `${lineD} L ${xPos(n - 1)},${baseY} L ${pad.l},${baseY} Z`;
  const hovP = hovered !== null ? burnoutTrend[hovered] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ cursor: "crosshair" }}>
        <defs>
          <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8494FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8494FF" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#burnGrad)" />
        <path d={lineD} fill="none" stroke="#8494FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xPos(0)}     cy={yPos(burnoutTrend[0].score)}     r="5" fill="#ef4444" />
        <circle cx={xPos(0)}     cy={yPos(burnoutTrend[0].score)}     r="9" fill="#ef4444" opacity="0.15" />
        <circle cx={xPos(n - 1)} cy={yPos(burnoutTrend[n - 1].score)} r="5" fill="#22c55e" />
        <circle cx={xPos(n - 1)} cy={yPos(burnoutTrend[n - 1].score)} r="9" fill="#22c55e" opacity="0.15" />
        {burnoutTrend.map((p, i) => {
          const x = xPos(i), y = yPos(p.score), isHov = hovered === i;
          return (
            <g key={i}>
              <rect x={x - pw / n / 2} y={pad.t} width={pw / n} height={ph} fill="transparent"
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
              {isHov && (
                <g>
                  <line x1={x} y1={pad.t} x2={x} y2={baseY} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x} cy={y} r="5" fill="#8494FF" />
                  <circle cx={x} cy={y} r="9" fill="#8494FF" opacity="0.15" />
                  <rect x={x - 20} y={y - 26} width={40} height={18} rx="5" fill="#8494FF" opacity="0.9" />
                  <text x={x} y={y - 13} textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="var(--font-body)">{p.score} / 5</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {hovP && (
        <p className="text-center text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Day {hovP.day} — Burnout score: <span className="font-bold" style={{ color: "#8494FF" }}>{hovP.score}/5</span>
        </p>
      )}
    </div>
  );
}

export default function StatsPage() {
  const [range, setRange]           = useState<Range>(30);
  const [showBefore, setShowBefore] = useState(true);
  const [showAfter, setShowAfter]   = useState(true);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const statCards = [
    { value: "+1.9",   label: "Avg mood lift",  sub: "over 30 days",       color: "#6367FF" },
    { value: "16",     label: "Total walks",     sub: "last 30 days",       color: "#8494FF" },
    { value: "4",      label: "Walks this week", sub: "↑ 1 from last week", color: "#6367FF" },
    { value: "5 days", label: "Best streak",     sub: "consecutive days",   color: "#C9BEFF" },
  ];

  const selectedWeek = activeWeek !== null ? weeklyWalkCounts[activeWeek] : null;

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map(({ value, label, sub, color }) => {
          const isActive = activeCard === label;
          return (
            <button key={label} type="button" onClick={() => setActiveCard(prev => prev === label ? null : label)}
              className="pw-card flex flex-col text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ border: isActive ? `1.5px solid ${color}` : undefined, boxShadow: isActive ? `0 0 0 3px ${color}18, var(--shadow)` : undefined }}>
              <span className="text-3xl font-bold leading-none tabular-nums" style={{ color }}>{value}</span>
              <span className="mt-2 text-xs font-bold">{label}</span>
              <span className="mt-0.5 text-[10px]" style={{ color: "var(--fg-muted)" }}>{sub}</span>
              {isActive && <span className="mt-2 text-[10px] font-semibold" style={{ color }}>Selected ✓</span>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-[3fr_2fr]">
        <div className="pw-card-lg space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Mood Trend</p>
              <p className="text-base font-bold mt-0.5">Before vs. After Walk</p>
            </div>
            <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
              {([7, 14, 30] as Range[]).map(r => (
                <button key={r} type="button" onClick={() => setRange(r)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{ background: range === r ? "var(--primary)" : "transparent", color: range === r ? "#fff" : "var(--fg-muted)" }}>
                  {r}D
                </button>
              ))}
            </div>
          </div>
          <MoodLineChart range={range} showBefore={showBefore} onToggleBefore={() => setShowBefore(p => !p)}
            showAfter={showAfter} onToggleAfter={() => setShowAfter(p => !p)} />
        </div>

        <div className="pw-card-lg space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Weekly Activity</p>
            <p className="text-base font-bold mt-0.5">
              {selectedWeek ? `${selectedWeek.week} — ${selectedWeek.count} walks` : "Walks per week"}
            </p>
          </div>
          <WeeklyBarChart activeWeek={activeWeek} onSelect={i => setActiveWeek(prev => prev === i ? null : i)} />
          {selectedWeek && (
            <div className="rounded-xl px-3 py-2 text-xs text-center animate-fade-in"
              style={{ background: "rgba(201,190,255,0.12)", color: "#8494FF" }}>
              Week of {selectedWeek.week} · {selectedWeek.count} walks completed
              {selectedWeek.count === Math.max(...weeklyWalkCounts.map(w => w.count)) && <span className="ml-1 font-bold">🏆 Best week</span>}
            </div>
          )}
        </div>
      </div>

      <div className="pw-card-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Burnout Trend</p>
            <p className="text-base font-bold mt-0.5">30-day burnout score</p>
          </div>
          <button type="button" className="rounded-full px-3 py-1 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>↓ Improving</button>
        </div>
        <BurnoutSparkline />
        <div className="flex justify-between text-xs" style={{ color: "var(--fg-muted)" }}>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />High burnout · Feb 27</span>
          <span className="flex items-center gap-1.5">Lower · Mar 28<span className="inline-block h-2 w-2 rounded-full bg-green-500" /></span>
        </div>
      </div>

      <div className="pw-card">
        <p className="text-sm font-bold mb-4">Last 30 days — summary</p>
        <div className="grid gap-2 md:grid-cols-2">
          {[
            { label: "Total walks",           value: "16",      color: "var(--fg)"  },
            { label: "Average before mood",   value: "2.1 / 5", color: "#8494FF"    },
            { label: "Average after mood",    value: "4.0 / 5", color: "#C9BEFF"    },
            { label: "Average lift per walk", value: "+1.9",    color: "#6367FF"    },
            { label: "Best streak",           value: "5 days",  color: "var(--fg)"  },
            { label: "Best walk day",         value: "Tuesday", color: "#6367FF"    },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:scale-[1.01] cursor-default"
              style={{ background: "var(--primary-dim)" }}>
              <span className="text-sm" style={{ color: "var(--fg-muted)" }}>{label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
