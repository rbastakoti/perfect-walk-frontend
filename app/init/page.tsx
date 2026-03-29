"use client";

/**
 * /init — runs once right after login.
 * Fetches calendar, weather, and nearby parks in parallel then caches them
 * in sessionStorage so every subsequent page loads instantly.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppCache } from "@/lib/app-cache";

interface Step {
  id:    string;
  label: string;
  needs: "always" | "location";   // "location" steps are skipped if geo denied
}

const STEPS: Step[] = [
  { id: "location", label: "Getting your location",   needs: "always"   },
  { id: "calendar", label: "Reading your calendar",   needs: "always"   },
  { id: "weather",  label: "Checking the weather",    needs: "location" },
  { id: "parks",    label: "Finding nearby parks",    needs: "location" },
  { id: "places",   label: "Loading nearby places",   needs: "location" },
];

export default function InitPage() {
  const router   = useRouter();
  const [done, setDone]       = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const ran = useRef(false);

  const markDone    = (id: string) => setDone(prev => new Set(prev).add(id));
  const markSkipped = (id: string) => setSkipped(prev => new Set(prev).add(id));

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function prefetch() {
      // ── If all data is already fresh in cache, skip straight to dashboard ──
      if (AppCache.allFresh("calendar", "weather", "parks", "location", "places-all")) {
        router.replace("/dashboard");
        return;
      }

      // ── Step 1: Geolocation ──────────────────────────────────────────────
      let lat: number | null = null;
      let lon: number | null = null;

      const cached = AppCache.get<{ lat: number; lon: number }>("location");
      if (cached) {
        lat = cached.lat;
        lon = cached.lon;
        markDone("location");
      } else {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60_000,
            })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          AppCache.set("location", { lat, lon });
          markDone("location");
        } catch {
          // location denied / unavailable
          markDone("location");               // mark done so the UI progresses
          markSkipped("weather");
          markSkipped("parks");
        }
      }

      // ── Step 2: Calendar + (if location) Weather + Parks in parallel ─────
      const calendarPromise = (AppCache.get("calendar")
        ? Promise.resolve(markDone("calendar"))
        : fetch("/api/calendar")
            .then(r => r.json())
            .then(data => { AppCache.set("calendar", data); markDone("calendar"); })
            .catch(() => markDone("calendar"))
      );

      const weatherPromise = (!lat || !lon || skipped.has("weather"))
        ? Promise.resolve(markDone("weather"))
        : AppCache.get("weather")
        ? Promise.resolve(markDone("weather"))
        : fetch(`/api/weather?lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(data => { AppCache.set("weather", data); markDone("weather"); })
            .catch(() => markDone("weather"));

      const parksPromise = (!lat || !lon || skipped.has("parks"))
        ? Promise.resolve(markDone("parks"))
        : AppCache.get("parks")
        ? Promise.resolve(markDone("parks"))
        : fetch(`/api/parks?lat=${lat}&lon=${lon}&radius=5000`)
            .then(r => r.json())
            .then(data => { AppCache.set("parks", data); markDone("parks"); })
            .catch(() => markDone("parks"));

      const placesPromise = (!lat || !lon || skipped.has("places"))
        ? Promise.resolve(markDone("places"))
        : AppCache.get("places-all")
        ? Promise.resolve(markDone("places"))
        : fetch(`/api/places?lat=${lat}&lon=${lon}&category=all`)
            .then(r => r.json())
            .then(data => {
              const places = data.places ?? [];
              // Only cache if we actually got results — empty array causes "No places found" on every visit
              if (places.length > 0) AppCache.set("places-all", places);
              markDone("places");
            })
            .catch(() => markDone("places"));

      await Promise.allSettled([calendarPromise, weatherPromise, parksPromise, placesPromise]);
      // Gather all loaded data from cache
      const locationData = AppCache.get<{ lat: number; lon: number }>("location");
      const calendarData = AppCache.get<{ events: any[] }>("calendar");
      const weatherData = AppCache.get<any>("weather");
      const parksData = AppCache.get<any>("parks");
      const placesData = AppCache.get<any[]>("places-all");

      // Prepare data for AI endpoints
      const aiPayload = {
        user_name: "User", // You can replace with actual user name if available
        location: locationData ? `${locationData.lat},${locationData.lon}` : undefined,
        calendar: calendarData,
        weather: weatherData,
        parks: parksData?.elements ?? parksData,
        places: placesData,
        walk_options: [], // You can fill this with walk options if available
      };

      // Call AI endpoints and log responses
      try {
        const [briefingRes, walkRecRes] = await Promise.all([
          fetch("/api/ai/briefing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiPayload),
          }).then(async r => {
            if (!r.ok) {
              const text = await r.text();
              throw new Error(`AI briefing API error: ${r.status} ${text}`);
            }
            return r.json();
          }),
          fetch("/api/ai/walk-recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiPayload),
          }).then(async r => {
            if (!r.ok) {
              const text = await r.text();
              throw new Error(`AI walk-recommendation API error: ${r.status} ${text}`);
            }
            return r.json();
          }),
        ]);
        if (briefingRes && briefingRes.briefing) {
          AppCache.set("ai-briefing", briefingRes.briefing);
        }
        if (walkRecRes && (walkRecRes.recommendations || walkRecRes.recommendation)) {
          // Support both: single object or array
          const rec = walkRecRes.recommendation || (Array.isArray(walkRecRes.recommendations) ? walkRecRes.recommendations[0] : walkRecRes.recommendations);
          if (rec) AppCache.set("ai-walk-recommendation", rec);
        }
        // eslint-disable-next-line no-console
        console.log("AI Briefing Response:", briefingRes);
        // eslint-disable-next-line no-console
        console.log("AI Walk Recommendation Response:", walkRecRes);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error calling AI endpoints:", err);
      }

      // Small pause so the user sees all steps complete before navigating
      setTimeout(() => router.replace("/dashboard"), 400);
    }

    prefetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total    = STEPS.filter(s => !skipped.has(s.id)).length;
  const finished = STEPS.filter(s => done.has(s.id) && !skipped.has(s.id)).length;
  const pct      = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)", color: "var(--fg)" }}>

      {/* Animated leaf */}
      <div className="mb-8 flex flex-col items-center">
        <svg viewBox="0 0 200 220" className="h-24 w-20 animate-leaf-sway drop-shadow-2xl"
          style={{ transformOrigin: "50% 8%" }}>
          <path d="M100 18 C155 18 184 58 184 100 C184 148 154 182 100 204 C46 182 16 148 16 100 C16 58 45 18 100 18 Z"
            fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
          <path d="M100 18 Q103 111 100 204" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M100 62 Q66 70 48 82"    fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M100 92 Q60 100 40 113"  fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M100 62 Q134 70 152 82"  fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M100 92 Q140 100 160 113" fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M100 204 L100 216" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          Perfect Walk
        </p>
      </div>

      <h1 className="text-xl font-bold mb-1 text-center">Setting up your day</h1>
      <p className="text-sm mb-8 text-center" style={{ color: "var(--fg-muted)" }}>
        Fetching your calendar, weather, and nearby parks…
      </p>

      {/* Progress bar */}
      <div className="w-64 mb-6">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--primary-dim)" }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6367FF, #C9BEFF)" }} />
        </div>
        <p className="text-right text-[10px] mt-1 tabular-nums" style={{ color: "var(--fg-muted)" }}>{pct}%</p>
      </div>

      {/* Step list */}
      <div className="w-64 flex flex-col gap-2.5">
        {STEPS.map(step => {
          const isDone    = done.has(step.id);
          const isSkipped = skipped.has(step.id);
          const isPending = !isDone && !isSkipped;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <span className="w-4 text-center text-sm transition-all"
                style={{ color: isDone ? "#22c55e" : isSkipped ? "var(--fg-muted)" : "var(--primary)", opacity: isPending ? 0.4 : 1 }}>
                {isDone ? "✓" : isSkipped ? "–" : "○"}
              </span>
              <span className="text-sm transition-all"
                style={{ color: isDone ? "var(--fg)" : "var(--fg-muted)", opacity: isPending ? 0.5 : 1 }}>
                {step.label}
                {isPending && <span className="ml-1 inline-block animate-pulse">…</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
