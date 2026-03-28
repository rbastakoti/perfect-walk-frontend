"use client";

import { useRef, useState } from "react";
import { wallSeed } from "@/lib/mock-data";
import { PostTag, WallPost } from "@/lib/types";

const TAG_CLASS: Record<PostTag, string> = {
  career:    "tag-career",
  burnout:   "tag-burnout",
  family:    "tag-family",
  uncertain: "tag-uncertain",
  walk:      "tag-walk",
};

function relTime(minutesAgo: number): string {
  if (minutesAgo < 1)  return "just now";
  if (minutesAgo < 60) return `${Math.round(minutesAgo)} min ago`;
  const h = Math.floor(minutesAgo / 60);
  if (h < 24)          return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function PostCard({ post, tapped, onToggle }: { post: WallPost; tapped: boolean; onToggle: (id: string) => void }) {
  const [popping, setPopping] = useState(false);

  const handleMeToo = () => {
    onToggle(post.id);
    setPopping(true);
    setTimeout(() => setPopping(false), 350);
  };

  return (
    <article className={`flex flex-col rounded-2xl p-4 h-full ${post.isNew ? "animate-post-in" : ""}`}
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ background: "var(--primary-dim)" }}>
            {post.avatar}
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
            Anonymous · {relTime(post.minutesAgo)}
          </span>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_CLASS[post.tag]}`}>
          {post.tag}
        </span>
      </div>
      <p className="flex-1 text-sm leading-relaxed" style={{ color: "var(--fg)" }}>{post.content}</p>
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={handleMeToo}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: tapped ? "rgba(255,219,253,0.35)" : "var(--primary-dim)",
            color:      tapped ? "#c026d3" : "var(--fg-muted)",
            border:     `1px solid ${tapped ? "rgba(192,38,211,0.3)" : "var(--border)"}`,
          }}>
          <span className={popping ? "animate-me-too-pop" : ""}><HeartIcon filled={tapped} /></span>
          <span className="tabular-nums">{(post.meTooCount + (tapped ? 1 : 0)).toLocaleString()}</span>
          {tapped && <span className="text-[11px]">Me too</span>}
        </button>
      </div>
    </article>
  );
}

export default function CommunityPage() {
  const [posts, setPosts]     = useState<WallPost[]>(wallSeed);
  const [tapped, setTapped]   = useState<Set<string>>(new Set());
  const [text, setText]       = useState("");
  const [posting, setPosting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const charLeft = 200 - text.length;
  const canPost  = text.trim().length >= 8 && text.length <= 200;

  const handleToggle = (id: string) => {
    setTapped(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canPost || posting) return;
    setPosting(true);
    const tags: PostTag[] = ["career", "burnout", "family", "uncertain", "walk"];
    const avatars = ["🌿", "🌊", "🌸", "🦋", "🌻", "🌙", "⭐", "🍃", "🌺", "🐚"];
    const newPost: WallPost = {
      id:         `p-${Date.now()}`,
      content:    text.trim(),
      tag:        tags[Math.floor(Math.random() * tags.length)],
      meTooCount: 0,
      avatar:     avatars[Math.floor(Math.random() * avatars.length)],
      minutesAgo: 0,
      isNew:      true,
    };
    setPosts(prev => [newPost, ...prev]);
    setText("");
    setPosting(false);
    setTimeout(() => {
      setPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, isNew: false } : p));
    }, 600);
  };

  return (
    <div className="animate-fade-in-up flex gap-6 items-start">

      {/* Left: sticky compose panel (desktop) */}
      <div className="hidden md:flex flex-col gap-4 w-72 shrink-0 sticky top-6">
        <div className="rounded-2xl p-5"
          style={{ background: "linear-gradient(145deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">The Wall</p>
          <h1 className="text-xl font-bold text-white leading-snug">Anonymous Community</h1>
          <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
            Share what you&apos;re carrying.<br />You&apos;re not alone.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: "var(--primary)" }}>A</div>
            <span className="text-sm font-semibold">Share anonymously</span>
          </div>
          <form onSubmit={handleSubmit}>
            <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value.slice(0, 200))}
              rows={5} placeholder="What are you carrying right now?"
              className="w-full resize-none px-4 py-3 text-sm outline-none"
              style={{ background: "var(--card)", color: "var(--fg)", caretColor: "var(--primary)" }} />
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)", background: "var(--primary-dim)" }}>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                Anonymous
                <span className={`ml-1 tabular-nums ${charLeft < 20 ? "text-red-400" : ""}`}>{charLeft}</span>
              </span>
              <button type="submit" disabled={!canPost || posting}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {posting ? "…" : "Post"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--fg-muted)" }}>
          No usernames · No profiles · Only &quot;Me too&quot;
        </p>
      </div>

      {/* Right: feed */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold">{posts.length} shared today</p>
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Live
          </span>
        </div>

        {/* Mobile compose */}
        <div className="md:hidden mb-4 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit}>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))}
              rows={3} placeholder="What are you carrying right now?"
              className="w-full resize-none px-4 py-3 text-sm outline-none"
              style={{ background: "var(--card)", color: "var(--fg)" }} />
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)", background: "var(--primary-dim)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Always anonymous · {charLeft}</span>
              <button type="submit" disabled={!canPost}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-white disabled:opacity-35"
                style={{ background: "var(--primary)" }}>Post</button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} tapped={tapped.has(post.id)} onToggle={handleToggle} />
          ))}
        </div>
      </div>
    </div>
  );
}
