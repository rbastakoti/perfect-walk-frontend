/**
 * Thin sessionStorage cache. Data lives for the browser session and expires
 * after TTL_MS. All keys are namespaced with "pw:" to avoid collisions.
 *
 * Keys used across the app:
 *   "location"  → { lat: number; lon: number }
 *   "weather"   → raw OpenWeather API response
 *   "calendar"  → { events: GoogleCalendarEvent[] }
 *   "parks"     → { elements: OsmElement[] }
 */

const PREFIX  = "pw:";
const TTL_MS  = 5 * 60 * 1000; // 5 minutes

export const AppCache = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const { v, t } = JSON.parse(raw) as { v: T; t: number };
      if (Date.now() - t > TTL_MS) {
        sessionStorage.removeItem(PREFIX + key);
        return null;
      }
      return v;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
    } catch {
      // storage quota exceeded — ignore silently
    }
  },

  /** Returns true if a fresh (non-expired) entry exists for every key supplied */
  allFresh(...keys: string[]): boolean {
    return keys.every(k => AppCache.get(k) !== null);
  },
};
