"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createClientBackendApi } from "@/lib/backend-api";

interface WallPost {
  id: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  attachedWalk?: {
    sessionId: string;
    trailName: string;
    distance: string;
    difficulty: "Easy" | "Moderate" | "Hard";
    actualDuration: number;
    estimatedSteps: number;
    estimatedCalories: number;
    moodImprovement: number;
    completedAt: string;
  };
  currentMood?: number;
  feelingTags?: string[];
  isNew?: boolean;
}

const FEELING_TAG_COLORS: Record<string, string> = {
  energized: "bg-green-100 text-green-800",
  peaceful: "bg-blue-100 text-blue-800",
  accomplished: "bg-purple-100 text-purple-800",
  happy: "bg-yellow-100 text-yellow-800",
  motivated: "bg-orange-100 text-orange-800",
  confident: "bg-indigo-100 text-indigo-800",
  refreshed: "bg-teal-100 text-teal-800",
};

function relTime(timestamp: string): string {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffMs = now.getTime() - postTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const h = Math.floor(diffMins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getUserInitials(username: string): string {
  return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function PostCard({ post, liked, onToggleLike }: { post: WallPost; liked: boolean; onToggleLike: (postId: string) => void }) {
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    await onToggleLike(post.postId);
    setLiking(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Moderate": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <article className={`flex flex-col rounded-2xl p-4 h-full ${post.isNew ? "animate-post-in" : ""}`}
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--primary)", color: "white" }}>
            {getUserInitials(post.username)}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--fg)" }}>
              {post.username}
            </div>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {relTime(post.timestamp)}
            </span>
          </div>
        </div>
        {post.currentMood && (
          <span className="shrin k-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
            style={{ background: "rgba(99,103,255,0.1)", color: "#6367FF" }}>
            😊 {post.currentMood}/5
          </span>
        )}
      </div>
      
      <p className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>{post.content}</p>
      
      {/* Feeling Tags */}
      {post.feelingTags && post.feelingTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.feelingTags.map(tag => (
            <span key={tag} className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              FEELING_TAG_COLORS[tag] || "bg-gray-100 text-gray-800"
            }`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Attached Walk Session */}
      {post.attachedWalk && (
        <div className="mt-3 rounded-xl p-3" 
          style={{ background: "var(--primary-dim)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚶‍♀️</span>
              <span className="text-sm font-semibold">{post.attachedWalk.trailName}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              getDifficultyColor(post.attachedWalk.difficulty)
            }`}>
              {post.attachedWalk.difficulty}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--fg-muted)" }}>
            <span>{post.attachedWalk.distance}</span>
            <span>{post.attachedWalk.actualDuration} min</span>
            <span>{post.attachedWalk.estimatedSteps} steps</span>
            <span>{post.attachedWalk.estimatedCalories} cal</span>
            {post.attachedWalk.moodImprovement > 0 && (
              <span style={{ color: "#22c55e" }}>+{post.attachedWalk.moodImprovement} mood</span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={handleLike} disabled={liking}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: liked ? "rgba(239,68,68,0.1)" : "var(--primary-dim)",
            color: liked ? "#ef4444" : "var(--fg-muted)",
            border: `1px solid ${liked ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
          }}>
          <HeartIcon filled={liked} />
          <span className="tabular-nums">{post.likes.toLocaleString()}</span>
        </button>
        
        {post.comments > 0 && (
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {post.comments} comment{post.comments !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </article>
  );
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const charLeft = 280 - text.length;
  const canPost = text.trim().length >= 8 && text.length <= 280 && session?.user;

  // Load feed on mount and session change
  useEffect(() => {
    if (session?.user) {
      loadFeed();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = createClientBackendApi(session);
      const feedData = await api.wall.getFeed(20, 0);
      setPosts(feedData.posts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load community feed');
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const api = createClientBackendApi(session);
      const result = await api.wall.toggleLike(postId);
      
      // Update local posts with new like count
      setPosts(prev => prev.map(post => 
        post.postId === postId 
          ? { ...post, likes: result.totalLikes }
          : post
      ));
      
      // Update liked posts set
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (result.liked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canPost || posting) return;
    
    setPosting(true);
    try {
      const api = createClientBackendApi(session);
      const postData = {
        userId: session!.user!.id!,
        username: session!.user!.name!,
        content: text.trim(),
        city: "all", // Required field for TheWall API
        feelingTags: ["energized", "accomplished"] // Default feeling tags
      };
      
      const result = await api.wall.createPost(postData);
      
      // Add optimistic post to feed
      const newPost: WallPost = {
        id: result.id,
        postId: result.postId,
        userId: session!.user!.id!,
        username: session!.user!.name!,
        content: text.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        feelingTags: ["energized", "accomplished"],
        isNew: true,
      };
      
      setPosts(prev => [newPost, ...prev]);
      setText("");
      
      // Remove new flag after animation
      setTimeout(() => {
        setPosts(prev => prev.map(p => 
          p.postId === result.postId ? { ...p, isNew: false } : p
        ));
      }, 600);
      
    } catch (err: any) {
      console.error('Failed to create post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-bold mb-2">Join the Community</h2>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Sign in to share your walking achievements and connect with other walkers
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up flex gap-6 items-start">

      {/* Left: sticky compose panel (desktop) */}
      <div className="hidden md:flex flex-col gap-4 w-72 shrink-0 sticky top-6">
        <div className="rounded-2xl p-5"
          style={{ background: "linear-gradient(145deg, #6367FF 0%, #8494FF 55%, #C9BEFF 100%)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Community Wall</p>
          <h1 className="text-xl font-bold text-white leading-snug">Walking Together</h1>
          <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
            Share your achievements.<br />Inspire others to walk.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: "var(--primary)" }}>A</div>
            <span className="text-sm font-semibold">Share your thoughts</span>
          </div>
          <form onSubmit={handleSubmit}>
            <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value.slice(0, 280))}
              rows={5} placeholder="Share your walking experience or thoughts..."
              className="w-full resize-none px-4 py-3 text-sm outline-none"
              style={{ background: "var(--card)", color: "var(--fg)", caretColor: "var(--primary)" }} />
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)", background: "var(--primary-dim)" }}>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                <span>Posting as {session?.user?.name}</span>
                <span className={`ml-2 tabular-nums ${charLeft < 30 ? "text-red-400" : ""}`}>{charLeft}</span>
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
          Share walking achievements · Connect with the community
        </p>
      </div>

      {/* Right: feed */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold">{posts.length} posts</p>
            {loading && (
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Loading...</span>
            )}
          </div>
          <button onClick={loadFeed} disabled={loading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Mobile compose */}
        <div className="md:hidden mb-4 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit}>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 280))}
              rows={3} placeholder="Share your walking experience..."
              className="w-full resize-none px-4 py-3 text-sm outline-none"
              style={{ background: "var(--card)", color: "var(--fg)" }} />
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)", background: "var(--primary-dim)" }}>
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>As {session?.user?.name} · {charLeft}</span>
              <button type="submit" disabled={!canPost || posting}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-white disabled:opacity-35"
                style={{ background: "var(--primary)" }}>{posting ? '...' : 'Post'}</button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3" 
            style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
            {error}
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          {posts.length === 0 && !loading ? (
            <div className="text-center py-8" style={{ color: "var(--fg-muted)" }}>
              <p className="text-sm">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard 
                key={post.postId} 
                post={post} 
                liked={likedPosts.has(post.postId)} 
                onToggleLike={handleToggleLike} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
