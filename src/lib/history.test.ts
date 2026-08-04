import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHistory,
  getHistory,
  getPersonalBest,
  saveResult,
  type HistoryEntry,
} from "@/lib/history";

function makeEntry(
  partial: Partial<HistoryEntry> = {}
): Omit<HistoryEntry, "id" | "date"> {
  return {
    wpm: 60,
    rawWpm: 70,
    accuracy: 95,
    correctChars: 300,
    incorrectChars: 10,
    extraChars: 2,
    time: 60,
    mode: "time",
    option: 30,
    ...partial,
  };
}

describe("history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(getHistory()).toEqual([]);
  });

  it("saves an entry at the front", () => {
    saveResult(makeEntry({ wpm: 40 }));
    saveResult(makeEntry({ wpm: 80 }));
    const history = getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].wpm).toBe(80);
    expect(history[1].wpm).toBe(40);
  });

  it("adds id and date on save", () => {
    const { entry } = saveResult(makeEntry());
    expect(entry.id).toBeTruthy();
    expect(entry.date).toBeGreaterThan(0);
  });

  it("caps history at MAX_ENTRIES", () => {
    for (let i = 0; i < 210; i++) {
      saveResult(makeEntry({ wpm: i }));
    }
    expect(getHistory()).toHaveLength(200);
  });

  it("finds the personal best per mode/option", () => {
    saveResult(makeEntry({ wpm: 50, mode: "time", option: 15 }));
    saveResult(makeEntry({ wpm: 90, mode: "time", option: 15 }));
    saveResult(makeEntry({ wpm: 999, mode: "zen", option: 0 }));
    const best = getPersonalBest("time", 15);
    expect(best?.wpm).toBe(90);
    expect(getPersonalBest("time", 60)).toBeNull();
  });

  it("clears history", () => {
    saveResult(makeEntry());
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it("ignores corrupt storage", () => {
    window.localStorage.setItem("typerreflex-history", "junk");
    expect(getHistory()).toEqual([]);
  });
});
