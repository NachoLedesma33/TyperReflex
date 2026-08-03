import type { HistoryEntry } from "@/lib/history";

export interface GlobalStats {
  tests: number;
  totalTypedChars: number;
  totalTimeSecs: number;
  bestWpm: number;
  bestWpmDate: number | null;
  wpmSum: number;
  accSum: number;
  activity: Record<string, number>;
}

const STATS_KEY = "typerreflex-stats";
const HEATMAP_KEY = "typerreflex-key-heatmap";

export const EMPTY_STATS: GlobalStats = {
  tests: 0,
  totalTypedChars: 0,
  totalTimeSecs: 0,
  bestWpm: 0,
  bestWpmDate: null,
  wpmSum: 0,
  accSum: 0,
  activity: {},
};

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function getStats(): GlobalStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<GlobalStats>;
    return {
      ...EMPTY_STATS,
      ...parsed,
      activity:
        parsed.activity && typeof parsed.activity === "object"
          ? (parsed.activity as Record<string, number>)
          : {},
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function recordStats(entry: HistoryEntry): GlobalStats {
  const stats = getStats();
  const t = dayKey(new Date());

  stats.tests += 1;
  stats.totalTypedChars +=
    entry.correctChars + entry.incorrectChars + entry.extraChars;
  stats.totalTimeSecs += entry.time;
  stats.wpmSum += entry.wpm;
  stats.accSum += entry.accuracy;
  if (entry.wpm > stats.bestWpm) {
    stats.bestWpm = entry.wpm;
    stats.bestWpmDate = entry.date;
  }
  stats.activity[t] = (stats.activity[t] ?? 0) + 1;

  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage errors
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("typerreflex-stats-updated"));
  }
  return stats;
}

export function computeStreak(activity: Record<string, number>): {
  current: number;
  longest: number;
} {
  const days = new Set(
    Object.entries(activity)
      .filter(([, n]) => n > 0)
      .map(([k]) => k)
  );

  let current = 0;
  let cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of [...days].sort()) {
    const t = new Date(`${k}T00:00:00`).getTime();
    if (prev !== null && t - prev === 86400000) run += 1;
    else run = 1;
    if (run > longest) longest = run;
    prev = t;
  }

  return { current, longest };
}

export function getKeyHeatmap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HEATMAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function recordKeyHeatmap(heatmap: Record<string, number>): void {
  const keys = Object.keys(heatmap);
  if (keys.length === 0) return;
  const cumulative = getKeyHeatmap();
  for (const k of keys) {
    cumulative[k] = (cumulative[k] ?? 0) + heatmap[k];
  }
  try {
    window.localStorage.setItem(HEATMAP_KEY, JSON.stringify(cumulative));
  } catch {
    // ignore storage errors
  }
}
