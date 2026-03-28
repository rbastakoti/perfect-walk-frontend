"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: "🍃",
    title: "Burnout Score",
    desc: "A living leaf that mirrors your mental energy in real time. When it wilts, your mind is signalling for a break.",
  },
  {
    icon: "🗓️",
    title: "Calendar-aware Breaks",
    desc: "Reads your Google Calendar and carves out recovery moments - so rest isn't an afterthought, it's scheduled.",
  },
  {
    icon: "🗺️",
    title: "Nearby Escape Routes",
    desc: "Surfaces real parks and trails near you. A 20-minute nature break reduces cortisol by up to 21%.",
  },
  {
    icon: "❤️",
    title: "Anonymous Support Wall",
    desc: "A safe space to say what you can't say at work. No names, no judgement - just humans being honest.",
  },
  {
    icon: "📈",
    title: "Mood Recovery Map",
    desc: "30-day before/after mood chart that shows exactly how your mental health shifts after each break.",
  },
  {
    icon: "🤖",
    title: "Daily AI Check-in",
    desc: "A personalised mental health nudge every morning - not generic advice, but tuned to your burnout pattern.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Rate your energy",
    desc: "A 2-second honest check-in. No long forms, no diary entries - just how you actually feel right now.",
  },
  {
    n: "02",
    title: "We find your window",
    desc: "Perfect Walk scans your calendar and surfaces the best mental recovery moment hiding in your day.",
  },
  {
    n: "03",
    title: "Step outside & reset",
    desc: "A short walk in nature. Log your mood after. Watch the data prove that it always, always helps.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const handleGoogle = () => signIn("google", { callbackUrl: "/init" });

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 md:px-14"
        style={{
          background: "rgba(248,246,255,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(99,103,255,0.12)",
          boxShadow: "0 1px 24px rgba(99,103,255,0.07)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold"
            style={{
              background: "linear-gradient(135deg, #6367FF 0%, #8494FF 100%)",
              boxShadow: "0 2px 12px rgba(99,103,255,0.35)",
            }}
          >
            🍃
          </div>
          <span
            className="text-[15px] font-extrabold tracking-tight"
            style={{ color: "#1a1040" }}
          >
            Perfect Walk
          </span>
        </div>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#steps" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-indigo-50"
              style={{ color: "#7070a0" }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGoogle}
            className="hidden md:block px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-indigo-50"
            style={{ color: "#6367FF" }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6367FF 0%, #8494FF 100%)",
              boxShadow: "0 3px 16px rgba(99,103,255,0.4)",
            }}
          >
            Get started
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 md:py-36 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 left-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #6367FF, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #FFDBFD, transparent)",
            }}
          />
        </div>

        <span
          className="relative mb-5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{
            background: "rgba(99,103,255,0.15)",
            color: "var(--primary)",
            border: "1px solid rgba(99,103,255,0.3)",
          }}
        >
          Mental health for the always-busy
        </span>

        <h1
          className="relative max-w-3xl text-4xl font-bold leading-tight md:text-6xl md:leading-tight"
          style={{ fontFamily: "var(--font-heading), serif" }}
        >
          Burnout is quiet.
          <br />
          <span style={{ color: "var(--primary)" }}>Recovery</span> should be
          simple.
        </h1>

        <p
          className="relative mt-5 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--fg-muted)" }}
        >
          Perfect Walk reads your calendar, finds recovery windows in your day,
          and nudges you outside - because a 20-minute break in nature is the
          most underrated mental health tool you already have.
        </p>

        <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold transition hover:opacity-90 active:scale-95"
            style={{
              background: "#fff",
              color: "#1f2937",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p
          className="relative mt-4 text-xs"
          style={{ color: "var(--fg-muted)" }}
        >
          Free · No credit card · Your data stays on your device
        </p>
      </section>

      {/* ── How it works ── */}
      <section id="steps" className="px-6 py-16 md:px-12">
        <p
          className="text-center text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent1)" }}
        >
          How it works
        </p>
        <h2 className="text-center text-2xl font-bold mb-12 md:text-3xl">
          Mental health support that fits your schedule
        </h2>
        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div
              key={n}
              className="rounded-2xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color: "var(--primary)", opacity: 0.25 }}
              >
                {n}
              </span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: "var(--fg-muted)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="px-6 py-16 md:px-12"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(99,103,255,0.05), transparent)",
        }}
      >
        <p
          className="text-center text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent1)" }}
        >
          Everything included
        </p>
        <h2 className="text-center text-2xl font-bold mb-12 md:text-3xl">
          Built for the always-busy
        </h2>
        <div className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: "var(--primary-dim)" }}
              >
                {icon}
              </div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--fg-muted)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="px-6 py-20 md:px-12 relative overflow-hidden">
        {/* Background accent */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, #6367FF, transparent)",
            }}
          />
        </div>

        <p
          className="text-center text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--accent1)" }}
        >
          By the numbers
        </p>
        <h2 className="text-center text-2xl font-bold md:text-3xl mb-2">
          What actually happens to your mind
        </h2>
        <p
          className="text-center text-sm mb-14 max-w-sm mx-auto"
          style={{ color: "var(--fg-muted)" }}
        >
          Real outcomes. Not wellness jargon.
        </p>

        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          {[
            {
              value: "+1.9",
              label: "mood improvement",
              sub: "per session, on a 1–5 wellbeing scale",
              icon: "🧠",
              quote:
                "I didn't believe 20 minutes could change my whole afternoon.",
              accent: "#6367FF",
              dim: "rgba(99,103,255,0.08)",
            },
            {
              value: "91%",
              label: "less mental fatigue",
              sub: "reported even on their hardest days",
              icon: "💜",
              quote: "First time in months I left work without a headache.",
              accent: "#8494FF",
              dim: "rgba(132,148,255,0.08)",
            },
            {
              value: "5 days",
              label: "avg recovery streak",
              sub: "of consecutive mental health check-ins",
              icon: "✨",
              quote: "Showing up for myself felt impossible. Now it's a habit.",
              accent: "#C9BEFF",
              dim: "rgba(201,190,255,0.10)",
            },
          ].map(({ value, label, sub, icon, quote, accent, dim }) => (
            <div
              key={label}
              className="rounded-3xl p-7 flex flex-col relative overflow-hidden"
              style={{ background: dim, border: `1px solid ${accent}30` }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accent}, transparent)`,
                }}
              />

              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl"
                  style={{ background: `${accent}20` }}
                >
                  {icon}
                </div>
                <div>
                  <p
                    className="text-3xl font-black leading-none"
                    style={{ color: accent }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-xs font-bold mt-0.5"
                    style={{ color: "var(--fg)" }}
                  >
                    {label}
                  </p>
                </div>
              </div>

              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: "var(--fg-muted)" }}
              >
                {sub}
              </p>

              {/* Mini quote */}
              <div
                className="mt-auto rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <p
                  className="text-xs italic leading-relaxed"
                  style={{ color: "var(--fg-muted)" }}
                >
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-24 pt-4 md:px-12">
        <div className="mx-auto max-w-4xl rounded-3xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)", boxShadow: "0 20px 80px rgba(99,103,255,0.3)" }}>
          <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #6367FF, transparent)" }} />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #FFDBFD, transparent)" }} />

          <div className="relative grid md:grid-cols-2">
            {/* Left — copy + testimonial */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-6 w-fit"
                style={{ background: "rgba(99,103,255,0.25)", color: "#C9BEFF", border: "1px solid rgba(99,103,255,0.3)" }}>
                🧠 Mental health, not hustle culture
              </span>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl leading-snug">
                You deserve to feel<br />
                <span style={{ color: "#C9BEFF" }}>okay</span> at work again.
              </h2>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                No therapy waiting list. No wellness retreat. Just small, real moments of recovery
                that fit inside the day you already have.
              </p>
              <div className="mt-6 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-sm italic leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                  &ldquo;I thought I was just tired. Turns out I was burned out for months and had no tool that understood that.&rdquo;
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: "#8494FF" }}>— Software engineer, 3 weeks in</p>
              </div>
            </div>

            {/* Right — CTA */}
            <div className="p-10 md:p-14 flex flex-col justify-center items-center text-center"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold mb-1 text-white/70">Start your recovery today</p>
              <p className="text-xs mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>Free · No credit card · 10 seconds to set up</p>
              <button type="button" onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 mb-5"
                style={{ background: "#fff", color: "#1a1040", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <div className="grid grid-cols-2 gap-2 w-full">
                {["🔒 Private by design", "📅 Reads your calendar", "🚫 No ads ever", "💜 Built for burnout"].map(t => (
                  <div key={t} className="rounded-xl px-3 py-2.5 text-xs text-center font-medium"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{
          color: "var(--fg-muted)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🍃</span>
          <span className="font-semibold">Perfect Walk</span>
        </div>
        Built with care for burned-out humans everywhere
      </footer>
    </div>
  );
}
