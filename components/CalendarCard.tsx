"use client";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  colorId?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

// Google Calendar color palette (colorId → hex)
const EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};
const DEFAULT_COLOR = "#5B5FE8";

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(dt?: string): string {
  if (!dt) return "All day";
  return new Date(dt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function groupByDay(events: CalendarEvent[]): { day: string; events: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = (ev.start.dateTime ?? ev.start.date ?? "").slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([day, evs]) => ({
    day: dayLabel(day + "T00:00:00"),
    events: evs,
  }));
}

export default function CalendarCard({
  events,
  loading,
  error,
}: {
  events: CalendarEvent[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  if (error === "no_token") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📅</span>
          <h2 className="text-xl font-semibold text-gray-800">Calendar</h2>
        </div>
        <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3">
          Sign out and sign back in with Google to grant calendar access.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📅</span>
          <h2 className="text-xl font-semibold text-gray-800">Calendar</h2>
        </div>
        <p className="text-sm text-red-500">⚠️ {error}</p>
      </div>
    );
  }

  const grouped = groupByDay(events);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📅</span>
        <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
        <span className="ml-auto text-sm text-gray-400">{events.length} this week</span>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl block mb-2">🎉</span>
          <p>No events this week</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ day, events: dayEvents }) => (
            <div key={day}>
              {/* Day header */}
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {day}
              </p>
              <div className="space-y-2">
                {dayEvents.map((ev) => {
                  const color = EVENT_COLORS[ev.colorId ?? ""] ?? DEFAULT_COLOR;
                  const isAllDay = !ev.start.dateTime;
                  const startTime = formatTime(ev.start.dateTime);
                  const endTime = formatTime(ev.end.dateTime);
                  const timeLabel = isAllDay ? "All day" : `${startTime} – ${endTime}`;

                  return (
                    <a
                      key={ev.id}
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all group"
                    >
                      {/* Color dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700">
                          {ev.summary ?? "(No title)"}
                        </p>
                        {ev.location && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            📍 {ev.location}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {timeLabel}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
