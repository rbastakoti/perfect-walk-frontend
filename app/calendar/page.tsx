"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DAY_START, DAY_END, CalEvent, detectGaps, getWalkSlots, formatTime, fromGoogleEvent } from "@/lib/calendar";
import { AppCache } from "@/lib/app-cache";

const HOUR_H  = 72;
const toPx    = (min: number) => ((min - DAY_START) / 60) * HOUR_H;
const durPx   = (dur: number) => (dur / 60) * HOUR_H;
const HOURS   = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
const TOTAL_H = ((DAY_END - DAY_START) / 60) * HOUR_H;

export default function CalendarPage() {
  const router = useRouter();
  const [events,  setEvents]  = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  function applyEvents(rawEvents: any[]) {
    const mapped = rawEvents
      .map((ev, i) => fromGoogleEvent(ev, i))
      .filter((e): e is CalEvent => e !== null);
    setEvents(mapped);
  }

  useEffect(() => {
    // Read from cache first — instant render, no spinner
    const cached = AppCache.get<{ events: any[] }>("calendar");
    if (cached) {
      applyEvents(cached.events ?? []);
      setLoading(false);
      return;
    }

    // Cache miss: fetch from API
    fetch("/api/calendar")
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          return;
        }
        AppCache.set("calendar", data);
        applyEvents(data.events ?? []);
      })
      .catch(() => setError("Failed to load calendar"))
      .finally(() => setLoading(false));
  }, []);

  const gaps      = detectGaps(events);
  const walkSlots = getWalkSlots(events);
  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <section className="animate-fade-in-up space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>
            {today}
          </p>
          <h1 className="text-xl font-bold mt-0.5">Today&apos;s Schedule</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
            {loading
              ? "Loading your calendar…"
              : error
              ? "Could not load calendar"
              : `${events.length} events · ${walkSlots.length} walk window${walkSlots.length !== 1 ? "s" : ""} detected`}
          </p>
        </div>
        {!loading && !error && walkSlots.length > 0 && (
          <span className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: "rgba(99,103,255,0.12)", color: "var(--primary)" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
            Gap detected
          </span>
        )}
      </div>

      {/* Walk window cards */}
      {!loading && !error && walkSlots.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {walkSlots.map((slot, i) => (
            <button key={i} type="button" onClick={() => router.push("/walk")}
              className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.015] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)", boxShadow: "0 6px 24px rgba(99,103,255,0.28)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                {i === 0 ? "Best Walk Window" : "Walk Window"}
              </p>
              <p className="text-xl font-bold text-white leading-snug">
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-white/70">
                  {slot.gapDuration ?? (slot.end - slot.start)} min free · tap for trails →
                </p>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white bg-white/20">🚶 Walk</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="pw-card-lg space-y-3 animate-pulse">
          {[80, 60, 100, 72].map((w, i) => (
            <div key={i} className="h-10 rounded-xl" style={{ width: `${w}%`, background: "var(--primary-dim)" }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="pw-card text-sm" style={{ color: "var(--fg-muted)" }}>
          {error === "no_token"
            ? "Sign in with Google to view your calendar."
            : `Calendar error: ${error}`}
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && (
        <div className="pw-card-lg overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--fg-muted)" }}>
            Full Day Timeline
          </p>
          <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
            <div className="relative" style={{ height: `${TOTAL_H + 32}px` }}>
              {HOURS.map(h => (
                <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none"
                  style={{ top: `${toPx(h * 60)}px` }}>
                  <span className="w-16 shrink-0 pr-3 text-right text-[10px] tabular-nums -translate-y-2.5 select-none"
                    style={{ color: "var(--fg-muted)" }}>
                    {formatTime(h * 60)}
                  </span>
                  <div className="flex-1" style={{ borderTop: "1px solid var(--border)" }} />
                </div>
              ))}

              <div className="absolute" style={{ left: "64px", right: "0", top: "0", bottom: "0" }}>
                {walkSlots.map((slot, i) => (
                  <button key={`walk-${i}`} type="button" onClick={() => router.push("/walk")}
                    className="absolute left-1 right-1 rounded-xl px-3 py-2 text-left transition-all hover:brightness-110 active:scale-[0.99]"
                    style={{
                      top:        `${toPx(slot.start) + 2}px`,
                      height:     `${Math.max(durPx(slot.end - slot.start) - 4, 40)}px`,
                      background: "linear-gradient(135deg, rgba(99,103,255,0.1), rgba(201,190,255,0.1))",
                      border:     "1.5px dashed rgba(99,103,255,0.35)",
                    }}>
                    <p className="text-xs font-bold leading-tight" style={{ color: "var(--primary)" }}>🚶 Perfect Walk</p>
                    {durPx(slot.end - slot.start) >= 48 && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>
                        {formatTime(slot.start)} – {formatTime(slot.end)} · Tap to explore trails
                      </p>
                    )}
                  </button>
                ))}

                {events.map(ev => (
                  <div key={ev.id} className="absolute left-1 right-1 rounded-xl px-3 py-2 overflow-hidden"
                    style={{
                      top:        `${toPx(ev.start) + 2}px`,
                      height:     `${Math.max(durPx(ev.end - ev.start) - 4, 28)}px`,
                      background: ev.bg,
                      borderLeft: `3px solid ${ev.color}`,
                    }}>
                    <p className="text-xs font-bold leading-tight truncate" style={{ color: ev.color }}>{ev.title}</p>
                    {ev.subtitle && durPx(ev.end - ev.start) >= 44 && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--fg-muted)" }}>{ev.subtitle}</p>
                    )}
                    {durPx(ev.end - ev.start) >= 52 && (
                      <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: "var(--fg-muted)" }}>
                        {formatTime(ev.start)} – {formatTime(ev.end)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gap summary */}
      {!loading && !error && gaps.length > 0 && (
        <div className="pw-card">
          <p className="text-sm font-bold mb-3">Detected Gaps</p>
          <div className="flex flex-col gap-2">
            {gaps.map((gap, i) => {
              const dur    = gap.end - gap.start;
              const isWalk = walkSlots.some(w => w.start === gap.start);
              return (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: isWalk ? "rgba(99,103,255,0.08)" : "var(--primary-dim)" }}>
                  <div className="flex items-center gap-2.5">
                    {isWalk
                      ? <span className="text-base">🚶</span>
                      : <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "var(--fg-muted)" }} />}
                    <span className="text-sm" style={{ color: isWalk ? "var(--primary)" : "var(--fg-muted)" }}>
                      {formatTime(gap.start)} – {formatTime(gap.end)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums font-semibold" style={{ color: "var(--fg-muted)" }}>{dur} min</span>
                    {isWalk && (
                      <button type="button" onClick={() => router.push("/walk")}
                        className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-white"
                        style={{ background: "var(--primary)" }}>
                        View trails
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="pw-card text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
          No events found for today — enjoy the free time!
        </div>
      )}
    </section>
  );
}
