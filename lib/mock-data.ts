import { BurnoutTrendPoint, MoodPoint, WallPost, WeeklyWalkCount } from "@/lib/types";

export const quotes = [
  "You do not have to carry every thought to the finish line.",
  "A ten-minute walk can reset a noisy afternoon.",
  "Progress is not loud. It is usually steady.",
  "Rest is not a reward. It is part of the work.",
  "Motion is the antidote to rumination.",
  "Your best thinking happens when your legs are moving.",
  "Fatigue is often just stillness in disguise.",
  "A changed perspective is worth a hundred decisions.",
];

export const breathingMessages = [
  "Breathe in for 4 counts.",
  "Hold for 2 counts.",
  "Breathe out for 6 counts.",
  "Settle into your pace.",
  "Notice what you hear.",
  "Feel your feet on the ground.",
  "Let that thought go.",
  "You are doing something good.",
  "Shoulders down. Jaw unclenched.",
  "This time is yours.",
];

export const aiBriefings: Record<number, string> = {
  1: "You are carrying a lot right now. This walk isn't about productivity — it is about giving your nervous system a genuine break. No goals, no pace. Just move.",
  2: "Today feels heavy. That is real. Walking shifts your brain from threat-detection to perspective. Notice three things around you. It sounds small. It is not.",
  3: "A moderate day. Your body and mind are in balance but could use a reset. A short loop will sharpen your focus for the afternoon without draining what you have left.",
  4: "You are in a good place. Light energy means you can go further, explore. Use this walk to consolidate what went well today.",
  5: "You are energized and clear. A walk right now is maintenance — keeping the streak, protecting the clarity. Insights come easily when you are already in flow.",
};

export const thirtyDayMood: MoodPoint[] = [
  { day: "Feb 27", before: 2, after: 4 },
  { day: "Feb 28", before: 1, after: 3 },
  { day: "Mar 1",  before: 2, after: 4 },
  { day: "Mar 2",  before: 3, after: 5 },
  { day: "Mar 3",  before: 3, after: 4 },
  { day: "Mar 4",  before: 2, after: 4 },
  { day: "Mar 5",  before: 1, after: 3 },
  { day: "Mar 6",  before: 2, after: 4 },
  { day: "Mar 7",  before: 2, after: 3 },
  { day: "Mar 8",  before: 1, after: 4 },
  { day: "Mar 9",  before: 3, after: 5 },
  { day: "Mar 10", before: 2, after: 4 },
  { day: "Mar 11", before: 2, after: 4 },
  { day: "Mar 12", before: 1, after: 3 },
  { day: "Mar 13", before: 2, after: 4 },
  { day: "Mar 14", before: 3, after: 5 },
  { day: "Mar 15", before: 1, after: 3 },
  { day: "Mar 16", before: 3, after: 4 },
  { day: "Mar 17", before: 2, after: 4 },
  { day: "Mar 18", before: 2, after: 4 },
  { day: "Mar 19", before: 1, after: 3 },
  { day: "Mar 20", before: 2, after: 4 },
  { day: "Mar 21", before: 2, after: 3 },
  { day: "Mar 22", before: 3, after: 5 },
  { day: "Mar 23", before: 3, after: 4 },
  { day: "Mar 24", before: 2, after: 4 },
  { day: "Mar 25", before: 2, after: 4 },
  { day: "Mar 26", before: 1, after: 3 },
  { day: "Mar 27", before: 2, after: 4 },
  { day: "Mar 28", before: 2, after: 4 },
];

export const weeklyWalkCounts: WeeklyWalkCount[] = [
  { week: "Feb 27", count: 3 },
  { week: "Mar 6",  count: 5 },
  { week: "Mar 13", count: 4 },
  { week: "Mar 20", count: 4 },
];

export const burnoutTrend: BurnoutTrendPoint[] = [
  { day: 1,  score: 4.3 }, { day: 2,  score: 3.1 }, { day: 3,  score: 2.0 },
  { day: 4,  score: 1.8 }, { day: 5,  score: 4.2 }, { day: 6,  score: 4.5 },
  { day: 7,  score: 4.1 }, { day: 8,  score: 4.3 }, { day: 9,  score: 3.2 },
  { day: 10, score: 2.1 }, { day: 11, score: 1.7 }, { day: 12, score: 4.3 },
  { day: 13, score: 4.6 }, { day: 14, score: 3.9 }, { day: 15, score: 4.2 },
  { day: 16, score: 3.0 }, { day: 17, score: 1.9 }, { day: 18, score: 1.8 },
  { day: 19, score: 4.1 }, { day: 20, score: 4.4 }, { day: 21, score: 4.2 },
  { day: 22, score: 4.5 }, { day: 23, score: 3.1 }, { day: 24, score: 2.0 },
  { day: 25, score: 1.9 }, { day: 26, score: 4.3 }, { day: 27, score: 4.4 },
  { day: 28, score: 4.0 }, { day: 29, score: 4.2 }, { day: 30, score: 3.8 },
];

export const wallSeed: WallPost[] = [
  { id: "p1",  content: "I didn't realize how empty I felt until I stepped outside. 15 minutes and something shifted.", tag: "burnout",   meTooCount: 234, avatar: "🌿", minutesAgo: 4   },
  { id: "p2",  content: "Six meetings. No lunch. By 3pm I was just a body in a chair. The walk didn't fix it. It helped me survive it.", tag: "career",    meTooCount: 178, avatar: "🌊", minutesAgo: 11  },
  { id: "p3",  content: "My kids needed me tonight and I had nothing left. This is why I walk now — I need to be a person before I can be a parent.", tag: "family",    meTooCount: 145, avatar: "🌸", minutesAgo: 23  },
  { id: "p4",  content: "Don't know where this job is going. The uncertainty is heavier than the workload.", tag: "uncertain", meTooCount: 145, avatar: "🦋", minutesAgo: 31  },
  { id: "p5",  content: "Three walks this week. Mood before: 2. After: 4. The numbers don't lie — this works.", tag: "walk",      meTooCount: 112, avatar: "🌻", minutesAgo: 42  },
  { id: "p6",  content: "Another all-hands where nothing changed. I walked after and remembered I have control over at least 20 minutes of my day.", tag: "career",    meTooCount: 98,  avatar: "🌙", minutesAgo: 55  },
  { id: "p7",  content: "Skipped lunch again. Forgot to drink water. Third week in a row. Something has to change.", tag: "burnout",   meTooCount: 189, avatar: "⭐", minutesAgo: 68  },
  { id: "p8",  content: "My mother called mid-crisis and I was already in crisis. Two people drowning. The walk helped me breathe first.", tag: "family",    meTooCount: 67,  avatar: "🍃", minutesAgo: 82  },
  { id: "p9",  content: "Still waiting on the layoff announcement. The silence is louder than any meeting.", tag: "uncertain", meTooCount: 201, avatar: "🌺", minutesAgo: 97  },
  { id: "p10", content: "Saw a dog on my walk today. Pet it. Forgot my name was Slack for a minute.", tag: "walk",      meTooCount: 156, avatar: "🐚", minutesAgo: 112 },
  { id: "p11", content: "Performance review tomorrow and I've been grinding for 2 months. Whatever the outcome — I showed up.", tag: "career",    meTooCount: 88,  avatar: "🦜", minutesAgo: 130 },
  { id: "p12", content: "Cried in the bathroom at work today. Not because of anything specific. Because of everything accumulated.", tag: "burnout",   meTooCount: 312, avatar: "🍀", minutesAgo: 155 },
  { id: "p13", content: "Sent my kid to school in mismatched shoes because I was in a 7am call. Parent guilt is real.", tag: "family",    meTooCount: 94,  avatar: "🌿", minutesAgo: 178 },
  { id: "p14", content: "I have no idea what I'm doing but I keep showing up. I guess that counts.", tag: "uncertain", meTooCount: 267, avatar: "🌊", minutesAgo: 201 },
  { id: "p15", content: "20 minutes outside before dinner. Every person in my house was calmer. Including me.", tag: "walk",      meTooCount: 134, avatar: "🌸", minutesAgo: 227 },
  { id: "p16", content: "My manager's manager doesn't know my name. I do 40 hours of invisible work a week.", tag: "career",    meTooCount: 178, avatar: "🦋", minutesAgo: 254 },
  { id: "p17", content: "Three years in and I think I hate this job. Or I hate what it's doing to me. I can't tell anymore.", tag: "burnout",   meTooCount: 245, avatar: "🌻", minutesAgo: 305 },
  { id: "p18", content: "Caregiving for a parent while working full time. Nobody has a word for this kind of tired.", tag: "family",    meTooCount: 189, avatar: "🌙", minutesAgo: 398 },
  { id: "p19", content: "Applied to three jobs this week. Got rejected from two. Still applying. Just walking and applying.", tag: "uncertain", meTooCount: 98,  avatar: "⭐", minutesAgo: 512 },
  { id: "p20", content: "First walk in 3 weeks. I forgot what sky looked like. I'm embarrassed how much I needed this.", tag: "walk",      meTooCount: 289, avatar: "🍃", minutesAgo: 720 },
];

export const weeklyMood = thirtyDayMood.slice(-7);
