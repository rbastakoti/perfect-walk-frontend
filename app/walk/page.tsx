"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { aiBriefings, breathingMessages, quotes } from "@/lib/mock-data";
import { BurnoutScore, WalkPhase } from "@/lib/types";

interface Trail {
  id: string; name: string; distance: string; duration: number;
  difficulty: "Easy" | "Moderate" | "Challenging";
  tags: string[]; description: string; color: string;
  mapBg: string; mapPath: string; dotX: number; dotY: number;
}

const TRAILS: Trail[] = [
  { id: "riverside", name: "Riverside Loop Park",  distance: "1.2 km", duration: 18, difficulty: "Easy",        tags: ["🚶 8 min walk", "🔄 Loop trail", "⛅ 72°F", "💨 Light breeze"], description: "A peaceful riverside loop for a quick mental reset.",                 color: "#6367FF", mapBg: "#0d2218", mapPath: "M230 178 Q230 42 224 42 Q158 42 136 88 Q114 134 140 178 Q178 200 230 178",                                              dotX: 230, dotY: 178 },
  { id: "greenfield", name: "Greenfield Trail",     distance: "2.4 km", duration: 32, difficulty: "Moderate",    tags: ["🌲 Forest path", "↗ Gentle incline", "🐦 Wildlife"],            description: "A shaded forest path, great for a mindful mid-day escape.",         color: "#22c55e", mapBg: "#0d1f0e", mapPath: "M80 180 Q90 80 160 60 Q240 40 295 105 Q325 150 295 180 Q235 212 155 192 Q100 178 80 180",                             dotX: 80,  dotY: 180 },
  { id: "harbor",     name: "Harbor Promenade",     distance: "1.8 km", duration: 24, difficulty: "Easy",        tags: ["🌊 Waterfront", "🌅 Scenic views", "🏃 Flat path"],              description: "Walk along the harbour for an instantly calming experience.",        color: "#0ea5e9", mapBg: "#080f1f", mapPath: "M55 115 Q118 72 200 78 Q282 84 342 112 Q328 162 248 176 Q162 186 80 165 Q48 145 55 115",                             dotX: 342, dotY: 112 },
  { id: "hilltop",    name: "Hilltop View Path",    distance: "3.1 km", duration: 45, difficulty: "Challenging", tags: ["⛰️ Elevation", "🌄 Summit views", "💪 Cardio boost"],            description: "A rewarding climb with panoramic views at the top.",                color: "#f59e0b", mapBg: "#1a1200", mapPath: "M100 190 Q122 140 162 92 Q202 50 252 68 Q302 92 312 148 Q318 196 262 210 Q182 225 100 190",                          dotX: 100, dotY: 190 },
  { id: "meadow",     name: "Meadow Stroll",        distance: "1.0 km", duration: 14, difficulty: "Easy",        tags: ["🌸 Open meadow", "☀️ Sunny", "🧘 Calm pace"],                   description: "A short open-air stroll — perfect when you only have 15 minutes.", color: "#c026d3", mapBg: "#180d1e", mapPath: "M100 140 Q150 80 220 90 Q290 100 310 140 Q290 185 220 192 Q148 200 100 140",                                          dotX: 220, dotY: 192 },
];

const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  Easy:        { bg: "rgba(34,197,94,0.15)",  color: "#22c55e" },
  Moderate:    { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  Challenging: { bg: "rgba(239,68,68,0.15)",  color: "#ef4444" },
};

const MOOD_EMOJIS = ["😩", "😣", "😐", "😊", "😄"];
const MOOD_LABELS = ["Drained", "Heavy", "Okay", "Lighter", "Calm"];
const CIRCUMFERENCE = 2 * Math.PI * 100;

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function TrailMap({ trail }: { trail: Trail }) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: 220, background: "#0a0e1e" }}>
      <svg viewBox="0 0 400 220" className="absolute inset-0 h-full w-full">
        {[30, 70, 110, 150, 190].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#141c34" strokeWidth="1" />)}
        {[50, 120, 190, 260, 330, 400].map(x => <line key={x} x1={x} y1="0" x2={x} y2="220" stroke="#141c34" strokeWidth="1" />)}
        <rect x="40" y="15" width="320" height="190" rx="14" fill={trail.mapBg} opacity="0.85" />
        <path d={trail.mapPath} fill="none" stroke={trail.color} strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />
        <circle cx={trail.dotX} cy={trail.dotY} r="7"  fill={trail.color} />
        <circle cx={trail.dotX} cy={trail.dotY} r="14" fill="none" stroke={trail.color} strokeWidth="2" opacity="0.35" />
        <circle cx={trail.dotX} cy={trail.dotY} r="22" fill="none" stroke={trail.color} strokeWidth="1" opacity="0.15" />
      </svg>
      <div className="absolute top-3 left-3 rounded-lg px-2.5 py-1 text-xs font-bold backdrop-blur-sm"
        style={{ background: `${trail.color}28`, color: trail.color }}>{trail.name}</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px]" style={{ color: "#8494FF" }}>
        <span>{trail.distance}</span><span>·</span><span>{trail.duration} min loop</span>
      </div>
    </div>
  );
}

function TrailCard({ trail, selected, onSelect }: { trail: Trail; selected: boolean; onSelect: () => void }) {
  const diff = DIFF_STYLE[trail.difficulty];
  return (
    <button type="button" onClick={onSelect}
      className="shrink-0 w-52 text-left rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: selected ? `${trail.color}14` : "var(--card)", border: `1.5px solid ${selected ? trail.color : "var(--border)"}`, boxShadow: selected ? `0 0 0 2px ${trail.color}22` : "var(--shadow)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold leading-tight" style={{ color: selected ? trail.color : "var(--fg)" }}>{trail.name}</p>
        {selected && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${trail.color}22`, color: trail.color }}>✓</span>}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={diff}>{trail.difficulty}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>{trail.distance}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>{trail.duration} min</span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>{trail.description}</p>
    </button>
  );
}

function MoodPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOOD_EMOJIS.map((emoji, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all hover:scale-105 active:scale-95"
          style={{ background: value === i + 1 ? "var(--primary)" : "var(--primary-dim)", border: `1px solid ${value === i + 1 ? "transparent" : "var(--border)"}` }}>
          <span className="text-2xl leading-none">{emoji}</span>
          <span className="text-[10px] font-semibold" style={{ color: value === i + 1 ? "#fff" : "var(--fg-muted)" }}>{MOOD_LABELS[i]}</span>
        </button>
      ))}
    </div>
  );
}

function Ring({ remaining, total }: { remaining: number; total: number }) {
  const ratio  = total > 0 ? remaining / total : 0;
  const offset = CIRCUMFERENCE * ratio;
  const color  = ratio > 0.55 ? "#6367FF" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 240 240" className="w-52 md:w-64">
        <circle cx="120" cy="120" r="100" fill="none" stroke="var(--primary-dim)" strokeWidth="16" />
        <circle cx="120" cy="120" r="100" fill="none" stroke={color} strokeWidth="16"
          strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
          transform="rotate(-90 120 120)" style={{ transition: "stroke-dashoffset 0.8s linear, stroke 1s ease" }} />
        <text x="120" y="113" textAnchor="middle" fill="var(--fg)" fontSize="42" fontWeight="800" fontFamily="var(--font-body)">{fmt(remaining)}</text>
        <text x="120" y="135" textAnchor="middle" fill="var(--fg-muted)" fontSize="12" fontFamily="var(--font-body)">remaining</text>
      </svg>
    </div>
  );
}

export default function WalkPage() {
  const router = useRouter();
  const [phase, setPhase]             = useState<WalkPhase>("trail");
  const [selectedTrail, setSelected]  = useState<Trail>(TRAILS[0]);
  const [beforeMood, setBeforeMood]   = useState<number | null>(null);
  const [afterMood, setAfterMood]     = useState<number | null>(null);
  const [remaining, setRemaining]     = useState(TRAILS[0].duration * 60);
  const [running, setRunning]         = useState(false);
  const [breathIdx, setBreathIdx]     = useState(0);
  const [saved, setSaved]             = useState(false);
  const quoteRef = useRef(quotes[Math.floor(Math.random() * quotes.length)]);

  const totalSeconds = selectedTrail.duration * 60;

  const handleSelectTrail = (trail: Trail) => {
    setSelected(trail);
    setRemaining(trail.duration * 60);
  };

  const burnoutScore = useMemo<BurnoutScore>(() => {
    if (typeof window === "undefined") return 2;
    const s = Number(localStorage.getItem("pw-burnout-score") ?? "2");
    return (s >= 1 && s <= 5 ? s : 2) as BurnoutScore;
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { window.clearInterval(id); setRunning(false); setPhase("after"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setBreathIdx(prev => (prev + 1) % breathingMessages.length), 8000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsed = totalSeconds - remaining;
  const steps   = Math.round(elapsed * 1.4);
  const km      = (steps * 0.0007).toFixed(2);
  const cal     = Math.round(elapsed * 0.08);
  const diff    = DIFF_STYLE[selectedTrail.difficulty];

  /* ── TRAIL phase ── */
  if (phase === "trail") {
    return (
      <div className="animate-fade-in-up space-y-5">
        <div className="pw-hero p-5 md:p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent1)" }}>Recommended Walk</p>
            <h1 className="text-2xl font-bold">{selectedTrail.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={diff}>{selectedTrail.difficulty}</span>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>{selectedTrail.distance}</span>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>{selectedTrail.duration} min</span>
            </div>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="btn-secondary shrink-0 text-xs">← Home</button>
        </div>

        <TrailMap trail={selectedTrail} />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>Choose a Trail</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TRAILS.map(trail => (
              <TrailCard key={trail.id} trail={trail} selected={trail.id === selectedTrail.id} onSelect={() => handleSelectTrail(trail)} />
            ))}
          </div>
        </div>

        <div className="pw-card space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent1)" }}>How are you feeling before?</p>
            <MoodPicker value={beforeMood} onChange={setBeforeMood} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, var(--primary-dim), rgba(255,219,253,0.08))", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent1)" }}>🤖 AI Briefing</p>
            <p className="text-sm leading-relaxed italic">{aiBriefings[burnoutScore]}</p>
          </div>
          <button type="button" disabled={!beforeMood}
            onClick={() => setPhase("timer")}
            className="btn-primary w-full py-3.5 text-sm text-center disabled:opacity-40">
            Start Walk — {selectedTrail.name} →
          </button>
        </div>
      </div>
    );
  }

  /* ── TIMER phase ── */
  if (phase === "timer") {
    return (
      <div className="animate-fade-in-up space-y-5">
        <div className="pw-hero p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--accent1)" }}>On your walk</p>
          <h1 className="text-xl font-bold">{selectedTrail.name}</h1>
        </div>

        <Ring remaining={remaining} total={totalSeconds} />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Steps",    val: steps.toLocaleString() },
            { label: "Distance", val: `${km} km`             },
            { label: "Calories", val: `${cal} kcal`          },
          ].map(({ label, val }) => (
            <div key={label} className="pw-card text-center">
              <p className="text-lg font-bold tabular-nums">{val}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {running && (
          <div className="rounded-2xl px-5 py-4 text-center animate-fade-in"
            style={{ background: "var(--primary-dim)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--accent1)" }}>
              {breathingMessages[breathIdx]}
            </p>
          </div>
        )}

        <div className="pw-card">
          <p className="text-xs italic leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            &ldquo;{quoteRef.current}&rdquo;
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setRunning(r => !r)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97] text-white"
            style={{ background: running ? "#ef4444" : "var(--primary)" }}>
            {running ? "Pause" : remaining === totalSeconds ? "Start" : "Resume"}
          </button>
          <button type="button" onClick={() => setPhase("after")}
            className="rounded-2xl px-5 py-3.5 text-sm font-semibold transition hover:opacity-80"
            style={{ background: "var(--primary-dim)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── AFTER phase ── */
  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="pw-hero p-6 text-center">
        <p className="text-4xl mb-2">🎉</p>
        <h1 className="text-2xl font-bold">Walk Complete!</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          {selectedTrail.name} · {Math.round((totalSeconds - remaining) / 60)} min · {km} km
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Steps",    val: steps.toLocaleString() },
          { label: "Distance", val: `${km} km`             },
          { label: "Calories", val: `${cal} kcal`          },
        ].map(({ label, val }) => (
          <div key={label} className="pw-card text-center">
            <p className="text-lg font-bold tabular-nums">{val}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="pw-card space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>How do you feel now?</p>
        <MoodPicker value={afterMood} onChange={setAfterMood} />
        {afterMood && beforeMood && afterMood > beforeMood && (
          <div className="rounded-xl px-4 py-3 text-center animate-fade-in"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
            <p className="text-sm font-bold">+{afterMood - beforeMood} mood lift 🌱</p>
            <p className="text-xs mt-0.5">The walk worked. Your data is being tracked.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" disabled={!afterMood}
          onClick={() => { setSaved(true); setTimeout(() => router.push("/dashboard"), 1200); }}
          className="flex-1 btn-primary py-3.5 text-sm text-center disabled:opacity-40">
          {saved ? "Saved ✓" : "Save & Finish"}
        </button>
        <button type="button" onClick={() => { setPhase("trail"); setRemaining(selectedTrail.duration * 60); setRunning(false); setBeforeMood(null); setAfterMood(null); }}
          className="rounded-2xl px-5 py-3.5 text-sm font-semibold transition hover:opacity-80"
          style={{ background: "var(--primary-dim)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
          Walk again
        </button>
      </div>
    </div>
  );
}
