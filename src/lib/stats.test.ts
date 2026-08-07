import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_STATS,
  computeStreak,
  dayKey,
  getStats,
  recordKeyHeatmap,
  recordStats,
  wpmDistribution,
  wpmPercentile,
} from "@/lib/stats";
import type { HistoryEntry } from "@/lib/history";

function makeEntry(partial: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "x",
    wpm: 60,
    rawWpm: 70,
    accuracy: 95,
    correctChars: 300,
    incorrectChars: 10,
    extraChars: 2,
    time: 60,
    mode: "time",
    option: 30,
    date: Date.now(),
    ...partial,
  };
}

describe("stats", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with empty stats", () => {
    expect(getStats()).toEqual(EMPTY_STATS);
  });

  it("accumulates across records", () => {
    recordStats(makeEntry({ wpm: 50, accuracy: 90, time: 30 }));
    recordStats(makeEntry({ wpm: 70, accuracy: 80, time: 60 }));
    const stats = getStats();
    expect(stats.tests).toBe(2);
    expect(stats.wpmSum).toBe(120);
    expect(stats.accSum).toBe(170);
    expect(stats.totalTimeSecs).toBe(90);
    expect(stats.totalTypedChars).toBe(624); // 312 per entry
    expect(stats.bestWpm).toBe(70);
  });

  it("tracks best wpm date", () => {
    recordStats(makeEntry({ wpm: 55 }));
    const stats = getStats();
    expect(stats.bestWpm).toBe(55);
    expect(stats.bestWpmDate).toBeTypeOf("number");
  });

  it("dispatches a stats-updated event", () => {
    let fired = 0;
    window.addEventListener("typerreflex-stats-updated", () => fired++);
    recordStats(makeEntry());
    expect(fired).toBe(1);
  });

  it("computes streaks", () => {
    const now = new Date();
    const mk = (daysAgo: number) =>
      dayKey(new Date(now.getTime() - daysAgo * 86400000));
    const activity = {
      [mk(0)]: 1,
      [mk(1)]: 1,
      [mk(2)]: 1,
      [mk(5)]: 1,
      [mk(6)]: 1,
    };
    const { current, longest } = computeStreak(activity);
    expect(current).toBe(3);
    expect(longest).toBe(3);
  });

  it("returns zero streak with no activity", () => {
    expect(computeStreak({})).toEqual({ current: 0, longest: 0 });
  });

  it("accumulates key heatmap", () => {
    recordKeyHeatmap({ a: 2, b: 1 });
    recordKeyHeatmap({ b: 3 });
    expect(window.localStorage.getItem("typerreflex-key-heatmap")).toContain(
      '"a":2'
    );
  });
});

describe("wpmPercentile", () => {
  const entries = [
    makeEntry({ wpm: 40 }),
    makeEntry({ wpm: 60 }),
    makeEntry({ wpm: 80 }),
    makeEntry({ wpm: 100 }),
  ];

  it("is 0 with no entries", () => {
    expect(wpmPercentile([], 70)).toBe(0);
  });

  it("counts entries at or below the given wpm", () => {
    expect(wpmPercentile(entries, 60)).toBe(50); // 40, 60
    expect(wpmPercentile(entries, 79)).toBe(50); // 40, 60
    expect(wpmPercentile(entries, 80)).toBe(75); // 40, 60, 80
    expect(wpmPercentile(entries, 100)).toBe(100); // all
    expect(wpmPercentile(entries, 120)).toBe(100);
  });

  it("is 100 when every run ties", () => {
    const same = [makeEntry({ wpm: 50 }), makeEntry({ wpm: 50 })];
    expect(wpmPercentile(same, 50)).toBe(100);
  });
});

describe("wpmDistribution", () => {
  it("is empty with no entries", () => {
    expect(wpmDistribution([])).toEqual([]);
  });

  it("buckets wpms in tens of wpm", () => {
    const dist = wpmDistribution([
      makeEntry({ wpm: 5 }),
      makeEntry({ wpm: 12 }),
      makeEntry({ wpm: 28 }),
      makeEntry({ wpm: 33 }),
    ]);
    expect(dist).toEqual([
      { min: 0, count: 1 },
      { min: 10, count: 1 },
      { min: 20, count: 1 },
      { min: 30, count: 1 },
    ]);
  });

  it("caps an exact multiple of the bucket size in the top bucket", () => {
    const dist = wpmDistribution([makeEntry({ wpm: 100 })]);
    expect(dist).toHaveLength(11);
    expect(dist[dist.length - 1]).toEqual({ min: 100, count: 1 });
  });

  it("keeps a sparse top bucket when max is well below a full bucket", () => {
    const dist = wpmDistribution([makeEntry({ wpm: 45 })]);
    expect(dist[dist.length - 1]).toEqual({ min: 40, count: 1 });
  });

  it("supports a custom bucket size", () => {
    const dist = wpmDistribution([makeEntry({ wpm: 50 })], 50);
    expect(dist).toEqual([
      { min: 0, count: 0 },
      { min: 50, count: 1 },
    ]);
  });
});
