"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { aiBriefings } from "@/lib/mock-data";
import { BurnoutScore } from "@/lib/types";
import { CalEvent, bestWalkSlot, formatTime, detectGaps, DAY_START, DAY_END, fromGoogleEvent, getWalkSlots } from "@/lib/calendar";
import { AppCache } from "@/lib/app-cache";

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
    // AI Briefing and Walk Recommendation
    const [aiBriefing, setAiBriefing] = useState<string>("");
    const [aiWalkRec, setAiWalkRec] = useState<any>(null);

  const router = useRouter();
  const { status } = useSession();
  const [view, setView] = useState<"checkin" | "dashboard">("checkin");
  const [score, setScore] = useState<BurnoutScore | null>(null);
  const [fading, setFading] = useState(false);

  // Weather — read from cache first
  const [weather, setWeather]           = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Calendar — read from cache first, converted to CalEvent[]
  const [calEvents, setCalEvents]       = useState<CalEvent[]>([]);
  const [calLoading, setCalLoading]     = useState(true);

  useEffect(() => {
    // Restore today's check-in if already done
    const today      = new Date().toDateString();
    const savedDate  = localStorage.getItem("pw-checkin-date");
    const savedScore = Number(localStorage.getItem("pw-checkin-score")) as BurnoutScore;
    if (savedDate === today && savedScore >= 1 && savedScore <= 5) {
      setScore(savedScore);
      setView("dashboard");
    }

    // Load AI Briefing and Walk Recommendation from cache
    const cachedBriefing = AppCache.get<string>("ai-briefing");
    if (cachedBriefing) setAiBriefing(cachedBriefing);
    let cachedRec = AppCache.get<any>("ai-walk-recommendation");
    if (cachedRec) setAiWalkRec(cachedRec);

    // If not in cache, fetch AI walk recommendation using latest context
    if (!cachedRec) {
      // Gather latest context from cache
      const locationData = AppCache.get<{ lat: number; lon: number }>("location");
      const calendarData = AppCache.get<{ events: any[] }>("calendar");
      const weatherData = AppCache.get<any>("weather");
      const parksData = AppCache.get<any>("parks");
      const placesData = AppCache.get<any[]>("places-all");
      const aiPayload = {
        user_name: "User",
        location: locationData ? `${locationData.lat},${locationData.lon}` : undefined,
        calendar: calendarData,
        weather: weatherData,
        parks: parksData?.elements ?? parksData,
        places: placesData,
        walk_options: [],
      };
      fetch("/api/ai/walk-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      })
        .then(async r => {
          if (!r.ok) {
            const text = await r.text();
            throw new Error(`AI walk-recommendation API error: ${r.status} ${text}`);
          }
          return r.json();
        })
        .then(walkRecRes => {
          let rec = walkRecRes.recommendation || (Array.isArray(walkRecRes.recommendations) ? walkRecRes.recommendations[0] : walkRecRes.recommendations);
          if (rec) {
            AppCache.set("ai-walk-recommendation", rec);
            setAiWalkRec(rec);
          }
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error("Error fetching AI walk recommendation on dashboard:", err);
        });
    }

    // ── Load weather from cache (instant) ──────────────────────────────────
    const cachedWeather = AppCache.get<any>("weather");
    if (cachedWeather) {
      setWeather(cachedWeather);
      setWeatherLoading(false);
    } else {
      // Fallback: fetch fresh (happens if user skipped /init or cache expired)
      const loc = AppCache.get<{ lat: number; lon: number }>("location");
      const doFetch = (lat: number, lon: number) =>
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then(r => r.json())
          .then(d => { AppCache.set("weather", d); setWeather(d); })
          .catch(() => {})
          .finally(() => setWeatherLoading(false));

      if (loc) {
        doFetch(loc.lat, loc.lon);
      } else {
        navigator.geolocation?.getCurrentPosition(
          p => doFetch(p.coords.latitude, p.coords.longitude),
          () => setWeatherLoading(false),
          { timeout: 8000 }
        );
      }
    }

    // ── Load calendar from cache (instant) ─────────────────────────────────
    const cachedCal = AppCache.get<{ events: any[] }>("calendar");
    if (cachedCal) {
      const mapped = (cachedCal.events ?? [])
        .map((ev, i) => fromGoogleEvent(ev, i))
        .filter((e): e is CalEvent => e !== null);
      setCalEvents(mapped);
      setCalLoading(false);
    }
    // else: fetch triggered by status effect below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback calendar fetch when cache is empty
  useEffect(() => {
    if (status !== "authenticated") return;
    if (AppCache.get("calendar")) { setCalLoading(false); return; }
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          AppCache.set("calendar", data);
          const mapped = (data.events ?? [])
            .map((ev: any, i: number) => fromGoogleEvent(ev, i))
            .filter((e: CalEvent | null): e is CalEvent => e !== null);
          setCalEvents(mapped);
        }
      })
      .catch(() => {})
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

  // Walk slot from real calendar events
  const walkSlot    = useMemo(() => calLoading ? null : bestWalkSlot(calEvents), [calEvents, calLoading]);
  const walkSlots   = useMemo(() => calLoading ? [] : getWalkSlots(calEvents), [calEvents, calLoading]);

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

  // Calendar signals from real events
  const totalDayMins  = DAY_END - DAY_START;
  const busyMins      = calEvents.reduce((s, e) => s + (e.end - e.start), 0);
  const densityPct    = Math.round((busyMins / totalDayMins) * 100);
  const densityLabel  = densityPct >= 60 ? "Heavy" : densityPct >= 35 ? "Moderate" : "Light";
  const densityWarn   = densityPct >= 60;
  const afterHours    = calEvents.filter(e => e.start >= 18 * 60);
  const hasAfterHours = afterHours.length > 0;
  const gaps          = detectGaps(calEvents);
  const freeMin       = gaps.reduce((s, g) => s + (g.end - g.start), 0);
  const freeLabel     = freeMin >= 60
    ? `${Math.floor(freeMin / 60)}h ${freeMin % 60 > 0 ? `${freeMin % 60}m` : ""}`.trim()
    : `${freeMin} min`;

  // Best park from cached parks (for the walk card)
  const cachedParks = AppCache.get<{ elements: any[] }>("parks");
  const bestPark    = cachedParks?.elements?.[0];
  const bestParkName = bestPark?.tags?.name || bestPark?.tags?.["name:en"] || "Nearby Park";
  const bestParkDist = bestPark ? `${((bestPark.distance as number) / 1609.34).toFixed(1)} mi away` : null;

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
            Based on your check-in + {calLoading ? "loading calendar…" : `${calEvents.length} events today`}
          </p>
        </div>
        <button type="button" onClick={() => { setView("checkin"); setScore(null); }}
          className="btn-secondary text-xs shrink-0">
          Re-check
        </button>
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

        {!weatherLoading && !weather && (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Enable location access to see live weather conditions.
          </p>
        )}

        {weather && !weatherLoading && (() => {
          const main    = weather.weather?.[0]?.main ?? "";
          const desc    = weather.weather?.[0]?.description ?? "";
          const temp    = Math.round(weather.main?.temp ?? 0);
          const feels   = Math.round(weather.main?.feels_like ?? 0);
          const humidity = weather.main?.humidity ?? 0;
          const wind    = Math.round((weather.wind?.speed ?? 0) * 2.237);
          const city    = weather.name ?? "";
          const good    = isGoodWalkWeather(main, temp);
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
                    style={{ background: good ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)", color: good ? "#22c55e" : "#ef4444" }}>
                    {good ? "Good walk weather" : "Stay inside"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Feels like", val: `${feels}°C`    },
                  { label: "Humidity",   val: `${humidity}%`   },
                  { label: "Wind",       val: `${wind} mph`    },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--primary-dim)" }}>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
                    <p className="text-sm font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
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

          {/* Calendar signals — live from real events */}
          {calLoading ? (
            <div className="mt-4 w-full space-y-1.5">
              {[70, 85, 60, 75].map((w, i) => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ width: `${w}%`, background: "var(--primary-dim)" }} />
              ))}
            </div>
          ) : (
            <div className="mt-4 w-full space-y-1.5 text-left">
              {[
                { label: "Meetings today",     val: `${calEvents.length}`,                                                              sub: `${busyMins} min blocked`,     warn: calEvents.length >= 5    },
                { label: "Calendar density",   val: densityLabel,                                                                       sub: `${densityPct}% of day`,       warn: densityWarn              },
                { label: "Free time left",     val: freeLabel,                                                                          sub: `${gaps.length} gaps found`,   warn: freeMin < 30             },
                { label: "After-hours events", val: hasAfterHours ? `${afterHours.length} event${afterHours.length > 1 ? "s" : ""}` : "None",
                  sub: hasAfterHours ? formatTime(afterHours[0].start) : "Clear evening", warn: hasAfterHours },
              ].map(({ label, val, sub, warn }) => (
                <div key={label} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                  style={{ background: "var(--primary-dim)" }}>
                  <div>
                    <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                    <span className="ml-1.5 text-[10px]" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>{sub}</span>
                  </div>
                  <span className="rounded-full px-2 py-0.5 font-semibold shrink-0"
                    style={{ background: warn ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: warn ? "#ef4444" : "#22c55e" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Walk window from real calendar */}
          {calLoading ? (
            <div className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--primary-dim)" }} />
          ) : walkSlot ? (
            <button type="button" onClick={() => router.push("/calendar")}
              className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)", boxShadow: "0 4px 20px rgba(99,103,255,0.25)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Walk Window Detected</p>
              <p className="text-xl font-bold text-white">{formatTime(walkSlot.start)} – {formatTime(walkSlot.end)}</p>
              <p className="mt-1 text-sm text-white/70">
                {walkSlots.length} window{walkSlots.length !== 1 ? "s" : ""} found · Tap to see your schedule →
              </p>
            </button>
          ) : (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold">No gaps found today</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Your schedule is packed — try a 5-min breathing walk.</p>
            </div>
          )}


          {showWalkRec && (
            <>
              {/* Existing "Perfect Walk Found" card */}
              <div className="rounded-2xl p-5 space-y-4 animate-slide-up"
                style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent1)" }}>Perfect Walk Found</p>
                  <h2 className="text-lg font-bold">{bestParkName}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      bestParkDist ? `📍 ${bestParkDist}` : "🚶 Nearby",
                      walkSlot ? `⏱ ${walkSlot.end - walkSlot.start} min window` : "🔄 Loop trail",
                      weather ? `${weatherEmoji(weather.weather?.[0]?.main ?? "")} ${Math.round(weather.main?.temp ?? 0)}°C` : "☀️ Check weather",
                    ].map((b) => (
                      <span key={b} className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>{b}</span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={handleGoNow}
                  className="btn-primary w-full py-3 text-center text-sm"
                  style={{ background: "var(--primary)" }}>
                  Go Now — Start Walk →
                </button>
              </div>

              {/* AI Walk Recommendation Card (if available) */}
              {aiWalkRec && (
                (() => {
                  // Normalize fields for display
                  const name = aiWalkRec.name || aiWalkRec.title || "Recommended Walk";
                  const typeLabel = aiWalkRec.typeLabel || aiWalkRec.type || "Walk";
                  const typeCategory = aiWalkRec.typeCategory || "leisure";
                  const description = aiWalkRec.description || aiWalkRec.desc || "A great walk recommended for you.";
                  const distance = aiWalkRec.distance ? (typeof aiWalkRec.distance === "number" ? `${aiWalkRec.distance} mi` : aiWalkRec.distance) : null;
                  const duration = aiWalkRec.duration || null;
                  const features = Array.isArray(aiWalkRec.features) ? aiWalkRec.features : (aiWalkRec.features ? [aiWalkRec.features] : []);
                  const lat = aiWalkRec.lat || aiWalkRec.latitude || null;
                  const lon = aiWalkRec.lon || aiWalkRec.longitude || null;
                  const osmUrl = aiWalkRec.osmUrl || (lat && lon ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}` : null);

                  // Map rendering (like PlaceCard)
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden hover:shadow-md transition-all group flex flex-col animate-slide-up">
                      {/* Map or fallback */}
                      <div className="relative h-44 overflow-hidden flex-shrink-0">
                        {lat && lon ? (
                          <iframe
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.001},${lat-0.001},${lon+0.001},${lat+0.001}&layer=mapnik&marker=${lat},${lon}`}
                            title={name}
                            className="absolute inset-0 w-full h-full border-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-indigo-50 text-indigo-400 text-4xl">🚶</div>
                        )}
                        {distance && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            {distance}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            AI Recommended Walk
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {typeLabel}
                          </span>
                          {features.length > 0 && (
                            <span className="text-xs text-gray-400 capitalize">{features.join(" · ")}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-base leading-tight mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
                          {name}
                        </h3>
                        {description && (
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-2">
                            {description}
                          </p>
                        )}
                        {duration && (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 mb-2 w-max">
                            {duration}
                          </span>
                        )}
                        {/* Links */}
                        <div className="flex gap-3 mt-auto pt-2.5 border-t border-gray-50">
                          {osmUrl && (
                            <a
                              href={osmUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                              OpenStreetMap →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </>
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
        <p className="text-sm leading-7 italic" style={{ color: "var(--fg)" }}>
          {aiBriefing || aiBriefings[score!]}
        </p>
      </div>
    </div>
  );
}
