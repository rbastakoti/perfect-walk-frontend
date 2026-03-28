"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { todayEvents, detectGaps, getWalkSlots } from "@/lib/calendar";

const BURNOUT_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Very Loaded", emoji: "🔴", color: "#ef4444" },
  2: { label: "Heavy",       emoji: "🟠", color: "#f97316" },
  3: { label: "Moderate",    emoji: "🟡", color: "#f59e0b" },
  4: { label: "Light",       emoji: "🟢", color: "#22c55e" },
  5: { label: "Energized",   emoji: "🟣", color: "#8b5cf6" },
};

function UserAvatar({ avatar, name, size = 72 }: { avatar?: string | null; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (avatar && !imgError) {
    return (
      <img src={avatar} alt={name} width={size} height={size} onError={() => setImgError(true)}
        className="rounded-full object-cover" style={{ width: size, height: size }}
        referrerPolicy="no-referrer" />
    );
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "var(--primary)" }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { mode, toggleMode } = useTheme();

  const [displayName, setDisplayName] = useState(session?.user?.name ?? "");
  const [editing, setEditing]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [checkinScore, setCheckinScore] = useState<number | null>(null);
  const [checkinDate,  setCheckinDate]  = useState<string | null>(null);
  const [joinedDate,   setJoinedDate]   = useState<string>("");

  useEffect(() => {
    const score = Number(localStorage.getItem("pw-checkin-score"));
    const date  = localStorage.getItem("pw-checkin-date");
    if (score >= 1 && score <= 5) setCheckinScore(score);
    if (date) setCheckinDate(date);
    if (!localStorage.getItem("pw-joined")) {
      localStorage.setItem("pw-joined", new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }));
    }
    setJoinedDate(localStorage.getItem("pw-joined") ?? "");
    const savedName = localStorage.getItem("pw-display-name");
    if (savedName) setDisplayName(savedName);
    else if (session?.user?.name) setDisplayName(session.user.name);
  }, [session?.user?.name]);

  const handleSaveName = () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    localStorage.setItem("pw-display-name", trimmed);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const name  = displayName || session?.user?.name || "You";
  const gaps  = detectGaps(todayEvents);
  const walks = getWalkSlots(todayEvents);
  const freeMin = gaps.reduce((s, g) => s + (g.end - g.start), 0);

  return (
    <section className="animate-fade-in-up max-w-2xl mx-auto space-y-5">

      {/* Profile header */}
      <div className="pw-card-lg flex items-center gap-5">
        <UserAvatar avatar={session?.user?.image} name={name} size={72} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={displayName} onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveName()} autoFocus
                className="flex-1 rounded-xl px-3 py-1.5 text-base font-bold outline-none"
                style={{ background: "var(--primary-dim)", color: "var(--fg)", border: "1.5px solid var(--primary)" }} />
              <button type="button" onClick={handleSaveName}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-white" style={{ background: "var(--primary)" }}>Save</button>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{name}</h1>
              <button type="button" onClick={() => setEditing(true)}
                className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition hover:opacity-80"
                style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>Edit</button>
              {saved && <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>Saved ✓</span>}
            </div>
          )}
          <p className="mt-0.5 text-sm truncate" style={{ color: "var(--fg-muted)" }}>
            {session?.user?.email ?? "demo mode"}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {session?.user ? (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(66,133,244,0.12)", color: "#4285F4" }}>
                <svg viewBox="0 0 24 24" className="h-3 w-3">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google account
              </span>
            ) : (
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>Demo mode</span>
            )}
            {joinedDate && <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Joined {joinedDate}</span>}
          </div>
        </div>
      </div>

      {/* Today's check-in */}
      <div className="pw-card">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent1)" }}>
          Today&apos;s Check-in
        </p>
        {checkinScore ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{BURNOUT_LABELS[checkinScore].emoji}</span>
              <div>
                <p className="text-sm font-bold">{BURNOUT_LABELS[checkinScore].label}</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {checkinDate === new Date().toDateString() ? "Checked in today" : `Last check-in: ${checkinDate}`}
                </p>
              </div>
            </div>
            <div className="h-2 w-32 rounded-full overflow-hidden" style={{ background: "var(--primary-dim)" }}>
              <div className="h-full rounded-full"
                style={{ width: `${((6 - checkinScore) / 5) * 100}%`, background: BURNOUT_LABELS[checkinScore].color }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>No check-in yet today</p>
            <button type="button" onClick={() => router.push("/dashboard")}
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
              Check in now
            </button>
          </div>
        )}
      </div>

      {/* Today's schedule summary */}
      <div className="pw-card">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent1)" }}>
          Today&apos;s Schedule
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: todayEvents.length, label: "Meetings",     color: "var(--primary)" },
            { value: walks.length,       label: "Walk windows", color: "#22c55e"        },
            { value: `${freeMin}m`,      label: "Free time",    color: "var(--accent1)" },
          ].map(({ value, label, color }) => (
            <div key={label} className="flex flex-col items-center rounded-xl py-3"
              style={{ background: "var(--primary-dim)" }}>
              <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
              <span className="mt-0.5 text-[10px]" style={{ color: "var(--fg-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => router.push("/calendar")}
          className="mt-3 w-full rounded-xl py-2 text-xs font-semibold transition hover:opacity-80"
          style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
          View full schedule →
        </button>
      </div>

      {/* Preferences */}
      <div className="pw-card space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Preferences</p>
        <div className="flex items-center justify-between rounded-xl px-3 py-3" style={{ background: "var(--primary-dim)" }}>
          <div>
            <p className="text-sm font-semibold">Appearance</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{mode === "dark" ? "Dark mode" : "Light mode"}</p>
          </div>
          <button type="button" onClick={toggleMode}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {mode === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="pw-card space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent1)" }}>Account</p>
        <div className="rounded-xl px-3 py-3" style={{ background: "var(--primary-dim)" }}>
          <p className="text-xs font-semibold mb-0.5">User ID</p>
          <p className="text-xs font-mono truncate" style={{ color: "var(--fg-muted)" }}>
            {session?.user?.email ?? "—"}
          </p>
        </div>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full rounded-xl py-3 text-sm font-bold transition hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
          Sign out
        </button>
      </div>
    </section>
  );
}
