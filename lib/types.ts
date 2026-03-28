export type ThemeMode = "light" | "dark";
export type MoodLevel = "drained" | "tired" | "okay" | "calm" | "energized";
export type BurnoutScore = 1 | 2 | 3 | 4 | 5;
export type WalkPhase = "trail" | "timer" | "after";
export type PostTag = "career" | "burnout" | "family" | "uncertain" | "walk";

export interface WallPost {
  id: string;
  content: string;
  tag: PostTag;
  meTooCount: number;
  avatar: string;
  minutesAgo: number;
  isNew?: boolean;
}

export interface MoodPoint {
  day: string;
  before: number;
  after: number;
}

export interface WeeklyWalkCount {
  week: string;
  count: number;
}

export interface BurnoutTrendPoint {
  day: number;
  score: number;
}
