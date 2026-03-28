export interface CalEvent {
  id: string;
  title: string;
  subtitle?: string;
  start: number; // minutes from midnight
  end: number;
  color: string;
  bg: string;
}

export const DAY_START = 7 * 60;  // 7:00 AM
export const DAY_END   = 21 * 60; // 9:00 PM

export const todayEvents: CalEvent[] = [
  { id: "e1", title: "Morning Standup",   subtitle: "Engineering · Zoom",         start: 8*60,      end: 8*60+30,   color: "#6367FF", bg: "rgba(99,103,255,0.13)"  },
  { id: "e2", title: "Deep Work Block",   subtitle: "Focus — no interrupts",       start: 9*60,      end: 10*60+30,  color: "#8494FF", bg: "rgba(132,148,255,0.12)" },
  { id: "e3", title: "Team Sync",         subtitle: "Cross-functional",            start: 11*60,     end: 11*60+30,  color: "#6367FF", bg: "rgba(99,103,255,0.13)"  },
  { id: "e4", title: "Lunch Break",       subtitle: "Blocked",                     start: 12*60,     end: 13*60,     color: "#059669", bg: "rgba(52,211,153,0.12)"  },
  { id: "e5", title: "Product Review",    subtitle: "Design · Figma walkthrough",  start: 14*60,     end: 15*60+30,  color: "#8494FF", bg: "rgba(132,148,255,0.12)" },
  { id: "e6", title: "1:1 with Manager",  subtitle: "Career check-in",             start: 16*60,     end: 16*60+30,  color: "#6367FF", bg: "rgba(99,103,255,0.13)"  },
  { id: "e7", title: "Email & Wrap-up",   subtitle: "Focus block",                 start: 18*60,     end: 18*60+45,  color: "#C9BEFF", bg: "rgba(201,190,255,0.15)" },
];

export interface Gap {
  start: number;
  end: number;
  gapDuration?: number; // actual free window size (only set on walk slots)
}

export function detectGaps(events: CalEvent[]): Gap[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const gaps: Gap[] = [];
  let cursor = DAY_START;
  for (const ev of sorted) {
    if (ev.start - cursor >= 30) gaps.push({ start: cursor, end: ev.start });
    cursor = Math.max(cursor, ev.end);
  }
  if (DAY_END - cursor >= 30) gaps.push({ start: cursor, end: DAY_END });
  return gaps;
}

// Score a gap by how desirable its mid-point time is for a walk.
// Peak hours 10am–2pm score highest; early morning and late evening score lowest.
function gapScore(gap: Gap): number {
  const mid = (gap.start + gap.end) / 2;
  const IDEAL = 12 * 60; // noon
  const distFromIdeal = Math.abs(mid - IDEAL);
  return Math.max(0, 180 - distFromIdeal);
}

export function getWalkSlots(events: CalEvent[]): Gap[] {
  return detectGaps(events)
    .filter(g => g.end - g.start >= 30)
    .sort((a, b) => gapScore(b) - gapScore(a))   // best time-of-day first
    .slice(0, 2)
    .sort((a, b) => a.start - b.start)            // display chronologically
    .map(g => ({
      start:       g.start,
      end:         Math.min(g.start + 30, g.end),
      gapDuration: g.end - g.start,
    }));
}

export function formatTime(min: number): string {
  const h  = Math.floor(min / 60);
  const m  = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m ? `${h12}:${m.toString().padStart(2, "0")} ${ap}` : `${h12} ${ap}`;
}

const GEV_COLORS = [
  { color: "#6367FF", bg: "rgba(99,103,255,0.13)"  },
  { color: "#8494FF", bg: "rgba(132,148,255,0.12)" },
  { color: "#059669", bg: "rgba(52,211,153,0.12)"  },
  { color: "#C9BEFF", bg: "rgba(201,190,255,0.15)" },
];

/**
 * Convert a raw Google Calendar API event object to CalEvent.
 * Returns null for all-day events, events outside DAY_START/DAY_END, and
 * events that don't fall on today's date.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromGoogleEvent(ev: any, idx: number): CalEvent | null {
  if (!ev.start?.dateTime || !ev.end?.dateTime) return null;

  const startDt = new Date(ev.start.dateTime);
  const endDt   = new Date(ev.end.dateTime);
  const now     = new Date();
  const isToday =
    startDt.getFullYear() === now.getFullYear() &&
    startDt.getMonth()    === now.getMonth()    &&
    startDt.getDate()     === now.getDate();
  if (!isToday) return null;

  const start = startDt.getHours() * 60 + startDt.getMinutes();
  const end   = endDt.getHours()   * 60 + endDt.getMinutes();
  if (end <= DAY_START || start >= DAY_END) return null;

  const { color, bg } = GEV_COLORS[idx % GEV_COLORS.length];
  return {
    id:       String(ev.id),
    title:    ev.summary ?? "Untitled",
    subtitle: ev.description?.split("\n")[0] ?? ev.location ?? undefined,
    start:    Math.max(start, DAY_START),
    end:      Math.min(end,   DAY_END),
    color,
    bg,
  };
}

export function bestWalkSlot(events: CalEvent[]): Gap | null {
  const slots = getWalkSlots(events);
  return slots.length > 0 ? slots[0] : null;
}
