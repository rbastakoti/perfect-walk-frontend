"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";

/* ─── Icons ──────────────────────────────────────────── */
const Icons = {
  Leaf: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M17 8C8 10 5.9 16.17 3.82 22H5.71C7.38 17.1 9.89 13.12 17 11V8z" />
      <path d="M10.93 4.71C11.3 4.22 11.66 3.73 12 3.27c.34.46.7.95 1.07 1.44A11.98 11.98 0 0 1 21 16h-2A10 10 0 0 0 10.93 4.71z" />
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  People: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  ),
  SignOut: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  ),
  Pin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: Icons.Leaf     },
  { href: "/walk",      label: "Walk",      Icon: Icons.Map      },
  { href: "/calendar",  label: "Today",     Icon: Icons.Calendar },
  { href: "/community", label: "Wall",      Icon: Icons.People   },
  { href: "/stats",     label: "Stats",     Icon: Icons.Chart    },
  { href: "/places",    label: "Places",    Icon: Icons.Pin      },
];

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/dashboard":  { title: "Dashboard",     sub: "Your daily burnout check"        },
  "/walk":       { title: "Walk",          sub: "Start or track a walk session"   },
  "/calendar":   { title: "Today",         sub: "Your schedule & walk windows"    },
  "/community":  { title: "The Wall",      sub: "Anonymous community support"     },
  "/stats":      { title: "Recovery Map",  sub: "Your mood trends & walk history" },
  "/places":     { title: "Places",        sub: "Nearby parks & trails"           },
  "/profile":    { title: "Profile",       sub: "Your account & preferences"      },
};

function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string | null; size?: number }) {
  const [imgErr, setImgErr] = React.useState(false);
  const px = size * 4;
  if (avatar && !imgErr) {
    return (
      <img src={avatar} alt={name} width={px} height={px} referrerPolicy="no-referrer"
        onError={() => setImgErr(true)}
        className={`h-${size} w-${size} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full text-sm font-bold text-white`}
      style={{ background: "var(--primary)" }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { mode, toggleMode } = useTheme();
  const pathname = usePathname();

  const isAuthenticated = status === "authenticated";
  const displayName = session?.user?.name ?? "You";
  const userAvatar = session?.user?.image;
  const userEmail = session?.user?.email;
  const meta = PAGE_META[pathname] ?? { title: "Perfect Walk", sub: "" };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-5"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ background: "var(--primary-dim)" }}>🍃</div>
          <span className="text-sm font-bold tracking-tight">Perfect Walk</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
          <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--fg-muted)" }}>Navigation</p>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                style={{
                  color: active ? "var(--primary)" : "var(--fg-muted)",
                  background: active ? "var(--primary-dim)" : "transparent",
                }}>
                <Icon />
                {label}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--primary)" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/profile"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:opacity-80"
            style={{ background: pathname === "/profile" ? "var(--primary-dim)" : "transparent" }}>
            <Avatar name={displayName} avatar={userAvatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-[11px]" style={{ color: "var(--fg-muted)" }}>
                {userEmail ?? "demo mode"}
              </p>
            </div>
            {isAuthenticated && (
              <button type="button" onClick={e => { e.preventDefault(); signOut({ callbackUrl: "/" }); }}
                title="Sign out"
                className="shrink-0 transition-opacity hover:opacity-70"
                style={{ color: "var(--fg-muted)" }}>
                <Icons.SignOut />
              </button>
            )}
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6"
          style={{ borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
          {/* Mobile: Logo */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm font-bold">🍃 Perfect Walk</span>
          </div>
          {/* Desktop: Page title */}
          <div className="hidden md:block">
            <h2 className="text-base font-bold">{meta.title}</h2>
            {meta.sub && <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{meta.sub}</p>}
          </div>
          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleMode} aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:opacity-80"
              style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
              {mode === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <Link href="/profile">
              <Avatar name={displayName} avatar={userAvatar} />
            </Link>
            {isAuthenticated && (
              <button type="button" onClick={() => signOut({ callbackUrl: "/" })}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:opacity-80 md:hidden"
                style={{ background: "var(--primary-dim)", color: "var(--fg-muted)" }}>
                <Icons.SignOut />
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center md:hidden"
        style={{ background: "var(--sidebar)", borderTop: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
        <ul className="grid w-full max-w-lg grid-cols-6 gap-1 px-2 py-2">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link href={href}
                  className="flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 transition-all"
                  style={{
                    color: active ? "var(--primary)" : "var(--fg-muted)",
                    background: active ? "var(--primary-dim)" : "transparent",
                  }}>
                  <Icon />
                  <span className="text-[10px] font-semibold">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
