"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { aiBriefings, breathingMessages, quotes } from "@/lib/mock-data";
import { BurnoutScore, WalkPhase } from "@/lib/types";
import { AppCache } from "@/lib/app-cache";
import { createClientBackendApi } from "@/lib/backend-api";

interface Trail {
  id: string; name: string; distance: string; duration: number;
  difficulty: "Easy" | "Moderate" | "Challenging";
  tags: string[]; description: string; color: string;
  mapBg: string; mapPath: string; dotX: number; dotY: number;
  lat?: number; lon?: number; // real coordinates for map tile
}

// ── Static fallback trails (used if location is denied) ─────────────────────
const FALLBACK_TRAILS: Trail[] = [
  { id: "riverside", name: "Riverside Loop Park",  distance: "0.7 mi", duration: 18, difficulty: "Easy",        tags: ["🚶 8 min walk", "🔄 Loop trail", "⛅ 72°F"], description: "A peaceful riverside loop for a quick mental reset.",                 color: "#6367FF", mapBg: "#0d2218", mapPath: "M230 178 Q230 42 224 42 Q158 42 136 88 Q114 134 140 178 Q178 200 230 178",                                              dotX: 230, dotY: 178 },
  { id: "greenfield", name: "Greenfield Trail",     distance: "1.5 mi", duration: 32, difficulty: "Moderate",    tags: ["🌲 Forest path", "↗ Gentle incline", "🐦 Wildlife"],            description: "A shaded forest path, great for a mindful mid-day escape.",         color: "#22c55e", mapBg: "#0d1f0e", mapPath: "M80 180 Q90 80 160 60 Q240 40 295 105 Q325 150 295 180 Q235 212 155 192 Q100 178 80 180",                             dotX: 80,  dotY: 180 },
  { id: "harbor",     name: "Harbor Promenade",     distance: "1.1 mi", duration: 24, difficulty: "Easy",        tags: ["🌊 Waterfront", "🌅 Scenic views", "🏃 Flat path"],              description: "Walk along the harbour for an instantly calming experience.",        color: "#0ea5e9", mapBg: "#080f1f", mapPath: "M55 115 Q118 72 200 78 Q282 84 342 112 Q328 162 248 176 Q162 186 80 165 Q48 145 55 115",                             dotX: 342, dotY: 112 },
  { id: "hilltop",    name: "Hilltop View Path",    distance: "1.9 mi", duration: 45, difficulty: "Challenging", tags: ["⛰️ Elevation", "🌄 Summit views", "💪 Cardio boost"],            description: "A rewarding climb with panoramic views at the top.",                color: "#f59e0b", mapBg: "#1a1200", mapPath: "M100 190 Q122 140 162 92 Q202 50 252 68 Q302 92 312 148 Q318 196 262 210 Q182 225 100 190",                          dotX: 100, dotY: 190 },
  { id: "meadow",     name: "Meadow Stroll",        distance: "0.6 mi", duration: 14, difficulty: "Easy",        tags: ["🌸 Open meadow", "☀️ Sunny", "🧘 Calm pace"],                   description: "A short open-air stroll — perfect when you only have 15 minutes.", color: "#c026d3", mapBg: "#180d1e", mapPath: "M100 140 Q150 80 220 90 Q290 100 310 140 Q290 185 220 192 Q148 200 100 140",                                          dotX: 220, dotY: 192 },
];

// ── Map park → Trail ─────────────────────────────────────────────────────────
const PARK_COLORS = ["#6367FF", "#22c55e", "#0ea5e9", "#f59e0b", "#c026d3"];
const MAP_BG_LIST = ["#0d2218", "#0d1f0e", "#080f1f", "#1a1200", "#180d1e"];
const MAP_PATHS   = [
  "M230 178 Q230 42 224 42 Q158 42 136 88 Q114 134 140 178 Q178 200 230 178",
  "M80 180 Q90 80 160 60 Q240 40 295 105 Q325 150 295 180 Q235 212 155 192 Q100 178 80 180",
  "M55 115 Q118 72 200 78 Q282 84 342 112 Q328 162 248 176 Q162 186 80 165 Q48 145 55 115",
  "M100 190 Q122 140 162 92 Q202 50 252 68 Q302 92 312 148 Q318 196 262 210 Q182 225 100 190",
  "M100 140 Q150 80 220 90 Q290 100 310 140 Q290 185 220 192 Q148 200 100 140",
];
const DOT_POS = [
  { x: 230, y: 178 }, { x: 80, y: 180 }, { x: 342, y: 112 }, { x: 100, y: 190 }, { x: 220, y: 192 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParkToTrail(park: any, idx: number): Trail {
  const name       = park.tags?.name || park.tags?.["name:en"] || "Nearby Park";
  const distM      = park.distance as number;             // metres from user
  const loopM      = Math.round(distM * 2 + 600);        // rough walk loop (metres)
  const distMi     = (loopM / 1609.34).toFixed(1);
  const duration   = Math.max(10, Math.round(loopM / 80));
  const difficulty: Trail["difficulty"] = duration < 20 ? "Easy" : duration < 35 ? "Moderate" : "Challenging";
  const walkMin    = Math.round(distM / 80);
  const ci         = idx % PARK_COLORS.length;

  const description =
    park.googleDescription ||
    park.tags?.description ||
    `A ${difficulty.toLowerCase()} walk — ${walkMin} min from your location.`;

  const pLat = park.lat ?? park.center?.lat;
  const pLon = park.lon ?? park.center?.lon;

  return {
    id:         String(park.id),
    name,
    distance:   `${distMi} mi`,
    duration,
    difficulty,
    tags:       [`🚶 ${walkMin} min away`, "📍 Nearby", difficulty === "Easy" ? "🌿 Easy pace" : difficulty === "Moderate" ? "🌲 Moderate" : "⛰️ Challenging"],
    description,
    color:      PARK_COLORS[ci],
    mapBg:      MAP_BG_LIST[ci],
    mapPath:    MAP_PATHS[ci],
    dotX:       DOT_POS[ci].x,
    dotY:       DOT_POS[ci].y,
    lat:        pLat,
    lon:        pLon,
  };
}

// ── Visual components ────────────────────────────────────────────────────────
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
  // If we have real coordinates, embed an OpenStreetMap tile view
  if (trail.lat && trail.lon) {
    const delta = 0.007; // ~0.5 mi bounding box
    const bbox  = `${trail.lon - delta},${trail.lat - delta},${trail.lon + delta},${trail.lat + delta}`;
    const src   = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${trail.lat},${trail.lon}`;
    return (
      <div className="relative overflow-hidden rounded-2xl" style={{ height: "220px" }}>
        <iframe
          src={src}
          title={trail.name}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />
        {/* Overlay bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 text-[10px] font-semibold"
          style={{ background: "rgba(10,14,30,0.75)", backdropFilter: "blur(8px)", color: "#8494FF" }}>
          <span style={{ color: trail.color }}>{trail.name}</span>
          <span>{trail.distance} · {trail.duration} min loop</span>
        </div>
      </div>
    );
  }

  // Fallback: stylised terrain illustration for demo trails without coordinates
  const uid = trail.id.replace(/\W/g, "");
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: "220px" }}>
      <svg viewBox="0 0 400 220" className="absolute inset-0 h-full w-full" style={{ display: "block" }}>
        <defs>
          {/* terrain gradient */}
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#1a3a2a" />
            <stop offset="50%"  stopColor="#14301e" />
            <stop offset="100%" stopColor="#0e2218" />
          </linearGradient>
          {/* trail glow */}
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* pin shadow */}
          <filter id={`pin-${uid}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={trail.color} floodOpacity="0.5" />
          </filter>
          {/* colour tint overlay */}
          <linearGradient id={`tint-${uid}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={trail.color} stopOpacity="0.10" />
            <stop offset="100%" stopColor={trail.color} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* base terrain */}
        <rect width="400" height="220" fill={`url(#bg-${uid})`} />

        {/* topographic contour lines */}
        {[
          "M0 160 Q80 145 160 155 Q240 165 320 148 Q370 138 400 142",
          "M0 130 Q60 118 140 128 Q220 138 300 120 Q360 108 400 113",
          "M0 100 Q70 88 150 98 Q230 108 310 90 Q365 78 400 84",
          "M0 72  Q80 60 160 70 Q240 80 320 62 Q372 50 400 56",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#22c55e" strokeWidth="0.6" strokeOpacity={0.18 - i * 0.03} />
        ))}

        {/* water / lake accent (only for water-themed trails) */}
        {trail.color === "#0ea5e9" && (
          <ellipse cx="310" cy="80" rx="55" ry="22" fill="#0ea5e9" fillOpacity="0.12" />
        )}

        {/* small tree clusters */}
        {[[60,140],[75,128],[90,142],[180,72],[195,60],[210,74],[310,150],[325,138]].map(([x,y],i)=>(
          <g key={i} transform={`translate(${x},${y})`} opacity="0.55">
            <polygon points="0,-11 7,4 -7,4" fill="#22c55e" opacity="0.8" />
            <polygon points="0,-7 5,5 -5,5" fill="#16a34a" opacity="0.6" transform="translate(0,6)" />
          </g>
        ))}

        {/* colour tint wash */}
        <rect width="400" height="220" fill={`url(#tint-${uid})`} />

        {/* trail path — solid with glow */}
        <path d={trail.mapPath} fill="none" stroke={trail.color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        <path d={trail.mapPath} fill="none" stroke={trail.color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#glow-${uid})`} />

        {/* distance tick marks along path — decorative dashes */}
        <path d={trail.mapPath} fill="none" stroke="white" strokeWidth="1"
          strokeDasharray="2 28" strokeLinecap="round" opacity="0.25" />

        {/* location pin */}
        <g filter={`url(#pin-${uid})`}>
          {/* pin body */}
          <ellipse cx={trail.dotX} cy={trail.dotY + 1} rx="9" ry="9" fill={trail.color} opacity="0.25" />
          <circle  cx={trail.dotX} cy={trail.dotY}     r="7"  fill={trail.color} />
          <circle  cx={trail.dotX} cy={trail.dotY}     r="3"  fill="white" opacity="0.9" />
        </g>
        {/* pulse rings */}
        <circle cx={trail.dotX} cy={trail.dotY} r="14" fill="none" stroke={trail.color} strokeWidth="1.5" opacity="0.35" />
        <circle cx={trail.dotX} cy={trail.dotY} r="22" fill="none" stroke={trail.color} strokeWidth="0.8" opacity="0.18" />

        {/* compass rose (top-right) */}
        <g transform="translate(370,22)" opacity="0.45">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#ffffff" strokeWidth="0.8" />
          <text x="0" y="-13" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">N</text>
          <line x1="0" y1="-7" x2="0" y2="7" stroke="white" strokeWidth="0.8" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="white" strokeWidth="0.8" />
          <polygon points="0,-7 2.5,0 -2.5,0" fill={trail.color} />
        </g>
      </svg>

      {/* name pill — top left */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.45)", color: "white", border: `1px solid ${trail.color}55` }}>
        <span style={{ color: trail.color }}>●</span> {trail.name}
      </div>

      {/* difficulty pill — top right (moved left of compass) */}
      <div className="absolute top-3 right-12 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md"
        style={{ background: `${trail.color}30`, color: trail.color, border: `1px solid ${trail.color}44` }}>
        {trail.difficulty}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5"
        style={{ background: "linear-gradient(to top, rgba(5,12,15,0.85), transparent)", backdropFilter: "blur(4px)" }}>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="text-base">🚶</span>
          <span>{trail.distance} loop</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="font-semibold" style={{ color: trail.color }}>{trail.duration} min</span>
          <span className="text-white/40">·</span>
          <span className="text-white/50">{trail.tags[0]}</span>
        </div>
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function WalkPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [trails, setTrails]           = useState<Trail[]>(FALLBACK_TRAILS);
  const [loadingParks, setLoadingParks] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied" | "error">("pending");

  const [phase, setPhase]             = useState<WalkPhase>("trail");
  const [selectedTrail, setSelected]  = useState<Trail>(FALLBACK_TRAILS[0]);
  const [beforeMood, setBeforeMood]   = useState<number | null>(null);
  const [afterMood, setAfterMood]     = useState<number | null>(null);
  const [remaining, setRemaining]     = useState(FALLBACK_TRAILS[0].duration * 60);
  const [running, setRunning]         = useState(false);
  const [breathIdx, setBreathIdx]     = useState(0);
  const [saved, setSaved]             = useState(false);
  const quoteRef = useRef(quotes[Math.floor(Math.random() * quotes.length)]);

  // Fetch nearby parks via geolocation
  const fetchNearbyParks = (lat: number, lon: number) => {
    setLoadingParks(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch(`/api/parks?lat=${lat}&lon=${lon}&radius=5000`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        clearTimeout(timer);
        const elements = data.elements ?? [];
        // filter parks that have a name
        const named = elements.filter((p: any) => p.tags?.name || p.tags?.["name:en"]);
        const source = named.length > 0 ? named : elements;
        if (source.length > 0) {
          const mapped: Trail[] = source.slice(0, 5).map(mapParkToTrail);
          setTrails(mapped);
          setSelected(mapped[0]);
          setRemaining(mapped[0].duration * 60);
          setLocationStatus("granted");
        } else {
          // API worked but no parks found nearby — keep fallbacks, show message
          setLocationStatus("error");
        }
      })
      .catch(() => {
        clearTimeout(timer);
        setLocationStatus("error");
      })
      .finally(() => setLoadingParks(false));
  };

  useEffect(() => {
    // Try cache first — instant, no geolocation prompt needed
    const cachedParks = AppCache.get<{ elements: any[] }>("parks");
    const cachedLoc   = AppCache.get<{ lat: number; lon: number }>("location");

    if (cachedParks?.elements?.length) {
      const named  = cachedParks.elements.filter(p => p.tags?.name || p.tags?.["name:en"]);
      const source = named.length > 0 ? named : cachedParks.elements;
      const mapped: Trail[] = source.slice(0, 5).map(mapParkToTrail);
      setTrails(mapped);
      setSelected(mapped[0]);
      setRemaining(mapped[0].duration * 60);
      setLocationStatus("granted");
      setLoadingParks(false);
      return;
    }

    // Cache miss: ask for geolocation and fetch
    if (!navigator.geolocation) {
      setLoadingParks(false);
      setLocationStatus("denied");
      return;
    }

    const startFetch = (lat: number, lon: number) => {
      AppCache.set("location", { lat, lon });
      fetchNearbyParks(lat, lon);
    };

    if (cachedLoc) {
      startFetch(cachedLoc.lat, cachedLoc.lon);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => startFetch(pos.coords.latitude, pos.coords.longitude),
        () => { setLocationStatus("denied"); setLoadingParks(false); },
        { timeout: 10000, maximumAge: 60000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSeconds = selectedTrail.duration * 60;

  const handleSelectTrail = (trail: Trail) => {
    setSelected(trail);
    setRemaining(trail.duration * 60);
  };

  // Capture complete walking session data including user info
  // afterMoodValue is passed explicitly to avoid stale closure capture
  const captureWalkingSession = (afterMoodValue: number | null) => {
    const elapsed = totalSeconds - remaining;
    const steps = Math.round(elapsed * 1.4);
    const miles = (steps * 0.000435).toFixed(2);
    const cal = Math.round(elapsed * 0.08);

    const sessionData = {
      // User identification for partitioning
      userId: session?.user?.id || null,

      // Session identification & timing
      sessionId: crypto.randomUUID(),
      startTime: new Date(Date.now() - elapsed * 1000),
      endTime: new Date(),
      plannedDuration: selectedTrail.duration,
      actualDuration: Math.round(elapsed / 60),
      completed: remaining === 0,

      // Trail/Location information
      trailId: selectedTrail.id,
      trailName: selectedTrail.name,
      trailType: trails === FALLBACK_TRAILS ? "fallback" : "real_park",
      distance: selectedTrail.distance,
      difficulty: selectedTrail.difficulty,
      locationUsed: locationStatus === "granted",

      // Activity metrics
      estimatedSteps: steps,
      estimatedDistance: parseFloat(miles),
      estimatedCalories: cal,

      // Wellness/mood tracking — use passed value, not closure
      moodBefore: beforeMood,
      moodAfter: afterMoodValue,
      moodImprovement: afterMoodValue && beforeMood ? afterMoodValue - beforeMood : 0,
      burnoutScoreAtTime: burnoutScore,

      // Session metadata
      quoteSeen: quoteRef.current,
      completionMethod: remaining === 0 ? "timer_finished" : "manual_done",
      timestamp: new Date().toISOString(),
    };

    return sessionData;
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
  const miles   = (steps * 0.000435).toFixed(2);   // ~0.7m/step ÷ 1609m/mi
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

        {/* Trail list */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>Choose a Trail</p>
            <div className="shrink-0 text-right">
              {loadingParks && (
                <span className="text-[10px] animate-pulse" style={{ color: "var(--fg-muted)" }}>📡 Finding nearby parks…</span>
              )}
              {!loadingParks && locationStatus === "granted" && (
                <span className="text-[10px]" style={{ color: "#22c55e" }}>📍 Parks near you</span>
              )}
              {!loadingParks && locationStatus === "denied" && (
                <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Location denied</span>
              )}
              {!loadingParks && locationStatus === "error" && (
                <button type="button"
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      p => fetchNearbyParks(p.coords.latitude, p.coords.longitude),
                      () => setLocationStatus("denied"),
                      { timeout: 10000, maximumAge: 0 }
                    )
                  }
                  className="text-[10px] underline" style={{ color: "var(--primary)" }}>
                  ⚠ Retry nearby parks
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trails.map(trail => (
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
            onClick={() => { setPhase("timer"); setRunning(true); }}
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
          {selectedTrail.name} · {Math.round((totalSeconds - remaining) / 60)} min · {miles} mi
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Steps",    val: steps.toLocaleString() },
          { label: "Distance", val: `${miles} mi`             },
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
          onClick={async () => {
            if (!session?.user) {
              console.warn('No user session found');
              setSaved(true);
              setTimeout(() => router.push("/dashboard"), 1200);
              return;
            }

            const walkData = captureWalkingSession(afterMood);
            
            try {
              setSaved(true); // Show saving state immediately
              
              // Send to FastAPI backend using structured API
              const api = createClientBackendApi(session);
              const result = await api.walkingSessions.add(walkData);

              console.log('Walk session saved successfully:', result);
              setTimeout(() => router.push("/dashboard"), 1200);
            } catch (error) {
              console.error('Failed to save walk session:', error);
              // TODO: Show error message to user, but still navigate
              setTimeout(() => router.push("/dashboard"), 1200);
            }
          }}
          className="flex-1 btn-primary py-3.5 text-sm text-center disabled:opacity-40">
          {saved ? "Saving... ✓" : "Save & Finish"}
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
