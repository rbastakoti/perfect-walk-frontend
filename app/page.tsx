"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "🍃", title: "Burnout Leaf",     desc: "A living leaf that reflects your daily energy. Wilting means it's time to move." },
  { icon: "🗓️", title: "Calendar Gaps",    desc: "Scans your schedule and places a Perfect Walk in every free window it finds." },
  { icon: "🗺️", title: "Trail Picker",     desc: "5 nearby trails ranked by your available time, difficulty, and current mood." },
  { icon: "❤️", title: "Anonymous Wall",   desc: "Share what you're carrying — no names, no profiles, just honest voices." },
  { icon: "📈", title: "Mood Recovery Map",desc: "30-day before/after mood chart that proves the walk always helps." },
  { icon: "🤖", title: "AI Briefing",      desc: "A personalised nudge every day based on your burnout score and patterns." },
];

const STEPS = [
  { n: "01", title: "Check in",     desc: "Tap your honest energy level — takes 2 seconds."         },
  { n: "02", title: "Find a gap",   desc: "We scan your calendar and surface the best walk window."  },
  { n: "03", title: "Walk & track", desc: "Pick a trail, start the timer, log your mood lift after." },
];

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const handleGoogle = () => signIn("google", { callbackUrl: "/dashboard" });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--fg)" }}>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 md:px-12"
        style={{ background: "rgba(8,8,26,0.7)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ background: "var(--primary-dim)" }}>🍃</div>
          <span className="text-sm font-bold tracking-tight">Perfect Walk</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleGoogle}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
            style={{ background: "var(--primary)" }}>
            Get started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 md:py-36 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #6367FF, transparent)" }} />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #FFDBFD, transparent)" }} />
        </div>

        <span className="relative mb-5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(99,103,255,0.15)", color: "var(--primary)", border: "1px solid rgba(99,103,255,0.3)" }}>
          Your burnout-aware walk companion
        </span>

        <h1 className="relative max-w-3xl text-4xl font-bold leading-tight md:text-6xl md:leading-tight"
          style={{ fontFamily: "var(--font-heading), serif" }}>
          The walk your{" "}
          <span style={{ color: "var(--primary)" }}>burnout</span>{" "}
          has been waiting for
        </h1>

        <p className="relative mt-5 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--fg-muted)" }}>
          Perfect Walk finds the gaps in your day, recommends a nearby trail, and
          tracks your mood lift — so you finally take the walk you keep skipping.
        </p>

        <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button type="button" onClick={handleGoogle}
            className="flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold transition hover:opacity-90 active:scale-95"
            style={{ background: "#fff", color: "#1f2937", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="relative mt-4 text-xs" style={{ color: "var(--fg-muted)" }}>
          Free · No credit card · Your data stays on your device
        </p>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-16 md:px-12">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent1)" }}>How it works</p>
        <h2 className="text-center text-2xl font-bold mb-12 md:text-3xl">Three steps to a clearer head</h2>
        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--primary)", opacity: 0.25 }}>{n}</span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-16 md:px-12"
        style={{ background: "linear-gradient(180deg, transparent, rgba(99,103,255,0.05), transparent)" }}>
        <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent1)" }}>Everything included</p>
        <h2 className="text-center text-2xl font-bold mb-12 md:text-3xl">Built for the always-busy</h2>
        <div className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: "var(--primary-dim)" }}>{icon}</div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-4xl grid gap-4 md:grid-cols-3 text-center">
          {[
            { value: "+1.9",   label: "avg mood lift per walk" },
            { value: "91%",    label: "felt better after walking" },
            { value: "5 days", label: "average best streak" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--primary)" }}>{value}</p>
              <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-24 md:px-12 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl p-10 md:p-14"
          style={{ background: "linear-gradient(135deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)", boxShadow: "0 8px 40px rgba(99,103,255,0.3)" }}>
          <h2 className="text-2xl font-bold text-white md:text-4xl">
            Your next walk is already scheduled.
          </h2>
          <p className="mt-3 text-base text-white/70">
            Perfect Walk found a gap in your day. Tap below to see it.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={handleGoogle}
              className="flex items-center gap-3 rounded-2xl px-7 py-3.5 text-sm font-bold transition hover:opacity-90 active:scale-95"
              style={{ background: "#fff", color: "#1f2937" }}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Get started free
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 text-center text-xs"
        style={{ color: "var(--fg-muted)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🍃</span>
          <span className="font-semibold">Perfect Walk</span>
        </div>
        Built with care for burned-out humans everywhere
      </footer>
    </div>
  );
}
