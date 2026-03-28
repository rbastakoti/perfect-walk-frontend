"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { aiBriefings } from "@/lib/mock-data";
import { BurnoutScore } from "@/lib/types";
import { todayEvents, bestWalkSlot, formatTime, detectGaps, DAY_START, DAY_END } from "@/lib/calendar";

/* ─── Weather helpers ────────────────────────────────── */
function weatherEmoji(main: string) {
  const map: Record<string, string> = {
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️", Haze: "🌫️",
  };
  return map[main] ?? "🌡️";
}

function isGoodWalkWeather(main: string, temp: number) {
  return !["Thunderstorm", "Snow", "Rain"].includes(main) && temp >= 5 && temp <= 35;
}

/* ─── Calendar helpers ───────────────────────────────── */
const EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

function fmtEventTime(dt?: string) {
  if (!dt) return "All day";
  return new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(events: any[]) {
  const map = new Map<string, any[]>();
  for (const ev of events) {
    const key = (ev.start?.dateTime ?? ev.start?.date ?? "").slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([key, evs]) => ({
    day: dayLabel(key + "T00:00:00"),
    events: evs,
  }));
}

const CHECK_IN = [
  { score: 1 as BurnoutScore, emoji: "🔴", label: "Very Loaded" },
  { score: 2 as BurnoutScore, emoji: "🟠", label: "Heavy"       },
  { score: 3 as BurnoutScore, emoji: "🟡", label: "Moderate"    },
  { score: 4 as BurnoutScore, emoji: "🟢", label: "Light"       },
  { score: 5 as BurnoutScore, emoji: "🟣", label: "Energized"   },
];

const LEAF_META: Record<
  BurnoutScore,
  { fill: string; stroke: string; vein: string; anim: string; message: string; label: string }
> = {
  1: { fill: "#b45309", stroke: "#78350f", vein: "#7c2d12", anim: "animate-leaf-droop", message: "You need this walk more than you know.", label: "Critical"  },
  2: { fill: "#ea580c", stroke: "#c2410c", vein: "#9a3412", anim: "animate-leaf-droop", message: "Carrying weight. Even a short walk helps.", label: "Heavy"   },
  3: { fill: "#d97706", stroke: "#b45309", vein: "#92400e", anim: "",                   message: "Steady — a walk will keep you here.", label: "Moderate"     },
  4: { fill: "#22c55e", stroke: "#16a34a", vein: "#15803d", anim: "animate-leaf-sway",  message: "Light and ready. The path is yours.", label: "Good"         },
  5: { fill: "#16a34a", stroke: "#15803d", vein: "#166534", anim: "animate-leaf-sway",  message: "You are in full bloom today.", label: "Thriving"            },
};

function BurnoutLeaf({ score }: { score: BurnoutScore }) {
  const m = LEAF_META[score];
  return (
    <svg viewBox="0 0 200 220" className={`h-48 w-36 drop-shadow-2xl ${m.anim}`} style={{ transformOrigin: "50% 8%" }}>
      <path d="M100 18 C155 18 184 58 184 100 C184 148 154 182 100 204 C46 182 16 148 16 100 C16 58 45 18 100 18 Z"
        fill={m.fill} stroke={m.stroke} strokeWidth="2" />
      <path d="M100 18 Q103 111 100 204" fill="none" stroke={m.vein} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M100 62 Q66 70 48 82"    fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M100 92 Q60 100 40 113"  fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M100 122 Q63 130 46 142" fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M100 62 Q134 70 152 82"  fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M100 92 Q140 100 160 113" fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M100 122 Q137 130 154 142" fill="none" stroke={m.vein} strokeWidth="1.1" strokeLinecap="round" />
      {score <= 2 && (
        <>
          <circle cx="70"  cy="88"  r="5.5" fill="rgba(0,0,0,0.12)" />
          <circle cx="130" cy="118" r="4.5" fill="rgba(0,0,0,0.10)" />
          <circle cx="88"  cy="148" r="3.5" fill="rgba(0,0,0,0.09)" />
        </>
      )}
      <path d="M100 204 L100 216" fill="none" stroke={m.stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MiniMap() {
  return (
    <div className="relative h-36 w-full overflow-hidden rounded-xl" style={{ background: "#0d1022" }}>
      <svg viewBox="0 0 360 144" className="absolute inset-0 h-full w-full">
        {[24, 56, 88, 120].map((y) => (
          <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#1e2a4a" strokeWidth="0.8" />
        ))}
        {[50, 120, 190, 260, 330].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="144" stroke="#1e2a4a" strokeWidth="0.8" />
        ))}
        <rect x="100" y="20" width="140" height="96" rx="12" fill="#0e2218" opacity="0.9" />
        <path d="M185 118 Q185 34 180 34 Q130 34 112 66 Q94 98 116 118 Q148 134 185 118"
          fill="none" stroke="#6367FF" strokeWidth="2.5" strokeDasharray="7 3.5" />
        <circle cx="185" cy="118" r="5.5" fill="#6367FF" />
        <circle cx="185" cy="118" r="10" fill="none" stroke="#6367FF" strokeWidth="1.5" opacity="0.4" />
      </svg>
      <span className="absolute bottom-2 left-3 text-xs font-semibold" style={{ color: "#8494FF" }}>
        Riverside Loop Park
      </span>
      <span className="absolute top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: "rgba(99,103,255,0.2)", color: "#C9BEFF" }}>
        1.2 km loop
      </span>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [view, setView] = useState<"checkin" | "dashboard">("checkin");
  const [score, setScore] = useState<BurnoutScore | null>(null);
  const [fading, setFading] = useState(false);

  // Weather
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // Calendar
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState("");

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("pw-checkin-date");
    const savedScore = Number(localStorage.getItem("pw-checkin-score")) as BurnoutScore;
    if (savedDate === today && savedScore >= 1 && savedScore <= 5) {
      setScore(savedScore);
      setView("dashboard");
    }
  }, []);

  // Fetch weather via geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then(r => r.json())
          .then(data => { if (data.error) throw new Error(data.error); setWeather(data); })
          .catch(e => setWeatherError(e.message))
          .finally(() => setWeatherLoading(false));
      },
      () => setWeatherLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch calendar
  useEffect(() => {
    if (status !== "authenticated") return;
    setCalLoading(true);
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setCalEvents(data.events ?? []); })
      .catch(e => setCalError(e.message))
      .finally(() => setCalLoading(false));
  }, [status]);

  const handleCheckIn = useCallback((s: BurnoutScore) => {
    setFading(true);
    setTimeout(() => {
      setScore(s);
      setView("dashboard");
      setFading(false);
      localStorage.setItem("pw-checkin-score", String(s));
      localStorage.setItem("pw-checkin-date", new Date().toDateString());
    }, 300);
  }, []);

  const handleGoNow = useCallback(() => {
    if (score) localStorage.setItem("pw-burnout-score", String(score));
    router.push("/walk");
  }, [score, router]);

  const showWalkRec = useMemo(() => score !== null && score <= 3, [score]);

  if (fading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Calculating your burnout leaf…</p>
      </div>
    );
  }

  /* ─── CHECK-IN VIEW ─── */
  if (view === "checkin") {
    return (
      <div className="animate-fade-in-up">
        <div className="pw-hero mb-6 p-8 text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>{greeting()}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">How loaded do you feel today?</h1>
          <p className="mt-2 text-base" style={{ color: "var(--fg-muted)" }}>
            Tap your honest energy level — this powers your burnout leaf.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3 md:gap-4">
          {CHECK_IN.map(({ score: s, emoji, label }) => (
            <button key={s} type="button" onClick={() => handleCheckIn(s)}
              className="group flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all hover:scale-105 active:scale-95 md:p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <span className="text-3xl md:text-4xl leading-none">{emoji}</span>
              <span className="text-xs font-bold md:text-sm" style={{ color: "var(--fg-muted)" }}>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl p-4 text-sm"
          style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>How it works: </span>
          Your answer + calendar density + time patterns = your Burnout Leaf score.
          A wilting leaf means it&apos;s time to walk. A full green leaf means you&apos;re thriving.
        </div>
      </div>
    );
  }

  /* ─── DASHBOARD VIEW ─── */
  const meta = LEAF_META[score!];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome banner */}
      <div className="pw-hero p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>
            {greeting()}
          </p>
          <h1 className="mt-0.5 text-xl font-bold">Your burnout status for today</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            Based on your check-in + calendar signals
          </p>
        </div>
        <button type="button" onClick={() => { setView("checkin"); setScore(null); }}
          className="btn-secondary text-xs shrink-0">
          Re-check
        </button>
      </div>

      {/* 2-column: Leaf + Content */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Leaf card */}
        <div className="flex flex-col items-center rounded-2xl p-6 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <span className="mb-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
            {meta.label} · Score {score}/5
          </span>

          <BurnoutLeaf score={score!} />
          <p className="mt-3 text-base font-semibold leading-relaxed">{meta.message}</p>

          <div className="mt-4 w-full max-w-xs">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--fg-muted)" }}>
              <span>Burnout Risk</span>
              <span>{score! <= 2 ? "High" : score! === 3 ? "Medium" : "Low"}</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--primary-dim)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${((6 - score!) / 5) * 100}%`,
                  background: score! <= 2 ? "#ef4444" : score! === 3 ? "#f59e0b" : "var(--primary)",
                }} />
            </div>
          </div>

          {(() => {
            const totalDayMins  = DAY_END - DAY_START;
            const busyMins      = todayEvents.reduce((s, e) => s + (e.end - e.start), 0);
            const densityPct    = Math.round((busyMins / totalDayMins) * 100);
            const densityLabel  = densityPct >= 60 ? "Heavy" : densityPct >= 35 ? "Moderate" : "Light";
            const densityWarn   = densityPct >= 60;
            const afterHours    = todayEvents.filter(e => e.start >= 18 * 60);
            const hasAfterHours = afterHours.length > 0;
            const gaps          = detectGaps(todayEvents);
            const freeMin       = gaps.reduce((s, g) => s + (g.end - g.start), 0);
            const freeLabel     = freeMin >= 60
              ? `${Math.floor(freeMin / 60)}h ${freeMin % 60 > 0 ? `${freeMin % 60}m` : ""}`.trim()
              : `${freeMin} min`;

            const signals = [
              { label: "Meetings today",     val: `${todayEvents.length}`,                                                          sub: `${busyMins} min blocked`,     warn: todayEvents.length >= 5 },
              { label: "Calendar density",   val: densityLabel,                                                                     sub: `${densityPct}% of day`,       warn: densityWarn             },
              { label: "Free time left",     val: freeLabel,                                                                        sub: `${gaps.length} gaps found`,   warn: freeMin < 30            },
              { label: "After-hours events", val: hasAfterHours ? `${afterHours.length} event${afterHours.length > 1 ? "s" : ""}` : "None", sub: hasAfterHours ? formatTime(afterHours[0].start) : "Clear evening", warn: hasAfterHours },
            ];

            return (
              <div className="mt-4 w-full space-y-1.5 text-left">
                {signals.map(({ label, val, sub, warn }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                    style={{ background: "var(--primary-dim)" }}>
                    <div>
                      <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                      <span className="ml-1.5 text-[10px]" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>{sub}</span>
                    </div>
                    <span className="rounded-full px-2 py-0.5 font-semibold shrink-0"
                      style={{
                        background: warn ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                        color:      warn ? "#ef4444" : "#22c55e",
                      }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {(() => {
            const slot = bestWalkSlot(todayEvents);
            return slot ? (
              <button type="button" onClick={() => router.push("/calendar")}
                className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)", boxShadow: "0 4px 20px rgba(99,103,255,0.25)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Walk Window Detected</p>
                <p className="text-xl font-bold text-white">{formatTime(slot.start)} – {formatTime(slot.end)}</p>
                <p className="mt-1 text-sm text-white/70">{slot.end - slot.start} min free · Tap to see your schedule →</p>
              </button>
            ) : (
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold">No gaps found today</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Your schedule is packed — try a 5-min breathing walk.</p>
              </div>
            );
          })()}

          {showWalkRec && (
            <div className="rounded-2xl p-5 space-y-4 animate-slide-up"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent1)" }}>Perfect Walk Found</p>
                <h2 className="text-lg font-bold">Riverside Loop Park</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["🚶 8 min walk", "🔄 18-min loop", "☀️ 72°F, breeze"].map((b) => (
                    <span key={b} className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>{b}</span>
                  ))}
                </div>
              </div>
              <MiniMap />
              <button type="button" onClick={handleGoNow}
                className="btn-primary w-full py-3 text-center text-sm"
                style={{ background: "var(--primary)" }}>
                Go Now — Start Walk →
              </button>
            </div>
          )}

          {!showWalkRec && (
            <div className="rounded-2xl p-5 animate-slide-up"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold mb-1">You&apos;re in good shape today 🎉</p>
              <p className="text-sm leading-6" style={{ color: "var(--fg-muted)" }}>
                A proactive walk will lock in this energy. Head to the{" "}
                <button type="button" onClick={() => router.push("/walk")} className="font-bold underline" style={{ color: "var(--primary)" }}>
                  Walk tab
                </button>{" "}
                when you&apos;re ready.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Briefing */}
      <div className="rounded-2xl p-5 md:p-6"
        style={{ background: "linear-gradient(135deg, var(--primary-dim), rgba(255,219,253,0.08))", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>AI Walk Briefing</p>
        </div>
        <p className="text-sm leading-7 italic" style={{ color: "var(--fg)" }}>{aiBriefings[score!]}</p>
      </div>

      {/* Weather */}
      <div className="rounded-2xl p-5 md:p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🌤</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>Current Weather</p>
        </div>

        {weatherLoading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
            <div className="h-4 w-4 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
            Fetching your local weather…
          </div>
        )}

        {weatherError && !weatherLoading && (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Could not load weather — {weatherError}
          </p>
        )}

        {!weatherLoading && !weatherError && !weather && (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Enable location access to see live weather conditions.
          </p>
        )}

        {weather && !weatherLoading && (() => {
          const main = weather.weather?.[0]?.main ?? "";
          const desc = weather.weather?.[0]?.description ?? "";
          const temp = Math.round(weather.main?.temp ?? 0);
          const feels = Math.round(weather.main?.feels_like ?? 0);
          const humidity = weather.main?.humidity ?? 0;
          const wind = Math.round((weather.wind?.speed ?? 0) * 3.6); // m/s → km/h
          const city = weather.name ?? "";
          const good = isGoodWalkWeather(main, temp);

          return (
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <span className="text-5xl leading-none">{weatherEmoji(main)}</span>
                <div>
                  <p className="text-3xl font-bold">{temp}°C</p>
                  <p className="text-sm capitalize" style={{ color: "var(--fg-muted)" }}>{desc}</p>
                  {city && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{city}</p>}
                </div>
                <div className="ml-auto shrink-0">
                  <span className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      background: good ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                      color: good ? "#22c55e" : "#ef4444",
                    }}>
                    {good ? "Good walk weather" : "Stay inside"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Feels like", val: `${feels}°C` },
                  { label: "Humidity",   val: `${humidity}%` },
                  { label: "Wind",       val: `${wind} km/h` },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl px-3 py-2.5 text-center"
                    style={{ background: "var(--primary-dim)" }}>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
                    <p className="text-sm font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Calendar Events */}
      <div className="rounded-2xl p-5 md:p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📅</span>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>Upcoming Events</p>
        </div>

        {calLoading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
            <div className="h-4 w-4 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
            Loading your calendar…
          </div>
        )}

        {calError && !calLoading && (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Could not load calendar — {calError}
          </p>
        )}

        {!calLoading && !calError && calEvents.length === 0 && (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No upcoming events found. Enjoy the open time!
          </p>
        )}

        {!calLoading && calEvents.length > 0 && (() => {
          const groups = groupByDay(calEvents).slice(0, 3);
          return (
            <div className="space-y-5">
              {groups.map(({ day, events }) => (
                <div key={day}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--accent1)" }}>{day}</p>
                  <div className="space-y-2">
                    {events.slice(0, 5).map((ev: any) => {
                      const color = EVENT_COLORS[ev.colorId ?? ""] ?? "var(--primary)";
                      const start = fmtEventTime(ev.start?.dateTime);
                      const end   = fmtEventTime(ev.end?.dateTime);
                      return (
                        <div key={ev.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                          style={{ background: "var(--primary-dim)" }}>
                          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{ev.summary ?? "Untitled"}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-muted)" }}>
                              {start === "All day" ? "All day" : `${start} – ${end}`}
                              {ev.location && ` · ${ev.location}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
