"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createClientBackendApi } from "@/lib/backend-api";
import { useBackendApi } from "@/lib/backend-hooks";

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



// ── Real Data Visualizations ────────────────────────────────────────────────
function MoodTrendChart({ sessions }: { sessions: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--fg-muted)" }}>
        No walking sessions data available
      </div>
    );
  }

  const W = 680, H = 200;
  const pad = { l: 32, r: 16, t: 24, b: 28 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const n = sessions.length;
  const xPos = (i: number) => pad.l + (i / Math.max(n - 1, 1)) * pw;
  const yPos = (v: number) => pad.t + (1 - (v - 1) / 4) * ph;
  const baseY = yPos(1);
  
  const beforePts = sessions.map((s, i) => [xPos(i), yPos(s.moodBefore)] as [number, number]);
  const afterPts = sessions.map((s, i) => [xPos(i), yPos(s.moodAfter)] as [number, number]);
  const beforeD = smoothPath(beforePts);
  const afterD = smoothPath(afterPts);
  const beforeArea = `${beforeD} L ${xPos(n - 1)},${baseY} L ${pad.l},${baseY} Z`;
  const afterArea = `${afterD} L ${xPos(n - 1)},${baseY} L ${pad.l},${baseY} Z`;
  
  const hovP = hovered !== null ? sessions[hovered] : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ cursor: "crosshair" }}>
        <defs>
          <linearGradient id="gradBeforeReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6367FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6367FF" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradAfterReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9BEFF" stopOpacity="0.35" />
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
        <path d={afterArea} fill="url(#gradAfterReal)" />
        <path d={beforeArea} fill="url(#gradBeforeReal)" />
        <path d={afterD} fill="none" stroke="#C9BEFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={beforeD} fill="none" stroke="#6367FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {sessions.map((s, i) => {
          const x = xPos(i);
          const yB = yPos(s.moodBefore);
          const yA = yPos(s.moodAfter);
          const isHov = hovered === i;
          return (
            <g key={i}>
              {(i % Math.max(1, Math.floor(n / 5)) === 0 || i === n - 1) && (
                <>
                  <circle cx={x} cy={yB} r="3.5" fill="#6367FF" />
                  <text x={x} y={yB - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6367FF" fontFamily="var(--font-body)">{s.moodBefore}</text>
                  <circle cx={x} cy={yA} r="3.5" fill="#C9BEFF" />
                  <text x={x} y={yA - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#C9BEFF" fontFamily="var(--font-body)">{s.moodAfter}</text>
                  <text x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-muted)" fontFamily="var(--font-body)">{i + 1}</text>
                </>
              )}
              <rect x={x - (pw / n) / 2} y={pad.t} width={pw / n} height={ph} fill="transparent" style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
              {isHov && (
                <g>
                  <line x1={x} y1={pad.t} x2={x} y2={baseY} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x} cy={yB} r="5" fill="#6367FF" opacity="0.9" />
                  <circle cx={x} cy={yB} r="9" fill="#6367FF" opacity="0.15" />
                  <circle cx={x} cy={yA} r="5" fill="#C9BEFF" opacity="0.9" />
                  <circle cx={x} cy={yA} r="9" fill="#C9BEFF" opacity="0.15" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="h-8 flex items-center justify-center gap-6 text-xs" style={{ color: "var(--fg-muted)" }}>
        {hovP ? (
          <>
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{hovP.trailName}</span>
            <span>Before: <b style={{ color: "#6367FF" }}>{hovP.moodBefore}</b></span>
            <span>After: <b style={{ color: "#C9BEFF" }}>{hovP.moodAfter}</b></span>
            <span>Lift: <b style={{ color: "#22c55e" }}>+{hovP.moodImprovement}</b></span>
          </>
        ) : <span>Hover over the chart to inspect walking sessions</span>}
      </div>
    </div>
  );
}

function WalkingHistoryList({ sessions }: { sessions: any[] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--fg-muted)" }}>
        No walking sessions found
      </div>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {sortedSessions.map((session, i) => {
        const date = new Date(session.timestamp).toLocaleDateString();
        const time = new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const diffStyle = session.difficulty === "Easy" ? { bg: "rgba(34,197,94,0.15)", color: "#22c55e" } :
                         session.difficulty === "Moderate" ? { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" } :
                         { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
        
        return (
          <div key={session.sessionId} className="rounded-xl p-3 transition-all hover:scale-[1.01]"
            style={{ background: "var(--primary-dim)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{session.trailName}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={diffStyle}>
                    {session.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-muted)" }}>
                  <span>{session.distance}</span>
                  <span>{session.estimatedSteps} steps</span>
                  <span>{session.estimatedCalories} cal</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{date}</div>
                <div className="text-xs" style={{ color: "var(--fg-muted)" }}>{time}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs">
                <span>Mood: {session.moodBefore} → {session.moodAfter}</span>
                {session.moodImprovement > 0 && (
                  <span className="font-bold" style={{ color: "#22c55e" }}>+{session.moodImprovement} lift</span>
                )}
              </div>
              <div className="text-xs" style={{ color: session.completed ? "#22c55e" : "var(--fg-muted)" }}>
                {session.completed ? "✓ Completed" : "Manual finish"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsOverview({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--fg-muted)" }}>
        No statistics data available
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {[
        { label: "Total walks completed", value: stats.totalSessions || 0, color: "var(--fg)" },
        { label: "Total distance covered", value: `${stats.totalDistance || 0} miles`, color: "#6367FF" },
        { label: "Calories burned", value: `${stats.totalCalories || 0} kcal`, color: "#22c55e" },
        { label: "Average mood improvement", value: `+${stats.averageMoodImprovement?.toFixed(1) || 0}`, color: "#C9BEFF" },
        { label: "Favorite difficulty", value: stats.favoriteDifficulty || "Unknown", color: "#f59e0b" },
        { label: "Walking consistency", value: stats.totalSessions > 0 ? "Active walker" : "Getting started", color: "var(--fg)" },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:scale-[1.01]"
          style={{ background: "var(--primary-dim)" }}>
          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>{label}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { data: session } = useSession();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Use backend hooks for walking sessions data
  const {
    data: historyData,
    loading: loadingHistory,
    error: historyError,
    refetch: refetchHistory
  } = useBackendApi(
    (session) => createClientBackendApi(session).walkingSessions.getHistory(),
    []
  );

  const {
    data: statsData,
    loading: loadingStats,
    error: statsError,
    refetch: refetchStats
  } = useBackendApi(
    (session) => createClientBackendApi(session).walkingSessions.getStats(),
    []
  );

  const statCards = [
    { value: statsData?.totalSessions?.toString() || "0", label: "Total walks", sub: "all time", color: "#6367FF" },
    { value: statsData?.totalDistance ? `${statsData.totalDistance} mi` : "0 mi", label: "Distance walked", sub: "all time", color: "#8494FF" },
    { value: statsData?.totalCalories?.toString() || "0", label: "Calories burned", sub: "estimated total", color: "#22c55e" },
    { value: statsData?.averageMoodImprovement ? `+${statsData.averageMoodImprovement.toFixed(1)}` : "+0", label: "Avg mood lift", sub: "per session", color: "#C9BEFF" },
  ];

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
        {/* Real Mood Trend from API Data */}
        <div className="pw-card-lg space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Your Walking Journey</p>
              <p className="text-base font-bold mt-0.5">Mood Changes Across Sessions</p>
            </div>
            <div className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {historyData?.sessions?.length || 0} sessions
            </div>
          </div>
          <MoodTrendChart sessions={historyData?.sessions || []} />
        </div>

        {/* Walking Sessions History */}
        <div className="pw-card-lg space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Recent Activity</p>
            <p className="text-base font-bold mt-0.5">Walking Sessions History</p>
          </div>
          <WalkingHistoryList sessions={historyData?.sessions || []} />
        </div>
      </div>

      {/* Stats Overview from Real API Data */}
      <div className="pw-card-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Your Progress</p>
            <p className="text-base font-bold mt-0.5">Walking Statistics Overview</p>
          </div>
          {statsData && (
            <div className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
              {statsData.favoriteDifficulty} preferred difficulty
            </div>
          )}
        </div>
        <StatsOverview stats={statsData} />
      </div>

      </section>
  );
}
