import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHistory,
  filterHistory,
  getHistory,
  getPersonalBest,
  matchesHistorySearch,
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

  describe("matchesHistorySearch", () => {
    const entry: HistoryEntry = {
      id: "1",
      wpm: 120,
      rawWpm: 130,
      accuracy: 98,
      correctChars: 300,
      incorrectChars: 5,
      extraChars: 0,
      time: 60,
      mode: "time",
      option: 30,
      date: new Date("2026-01-02T10:00:00").getTime(),
    };

    it("matches everything with an empty query", () => {
      expect(matchesHistorySearch(entry, "")).toBe(true);
      expect(matchesHistorySearch(entry, "   ")).toBe(true);
    });

    it("matches mode", () => {
      expect(matchesHistorySearch(entry, "time")).toBe(true);
      expect(matchesHistorySearch(entry, "zen")).toBe(false);
    });

    it("matches option, wpm, accuracy and raw wpm", () => {
      expect(matchesHistorySearch(entry, "30")).toBe(true);
      expect(matchesHistorySearch(entry, "120")).toBe(true);
      expect(matchesHistorySearch(entry, "98")).toBe(true);
      expect(matchesHistorySearch(entry, "130")).toBe(true);
      expect(matchesHistorySearch(entry, "999")).toBe(false);
    });

    it("matches the formatted date", () => {
      expect(matchesHistorySearch(entry, "2026")).toBe(true);
      expect(matchesHistorySearch(entry, "2030")).toBe(false);
    });
  });

  describe("filterHistory", () => {
    const entries: HistoryEntry[] = [
      { ...makeEntry({ wpm: 80, mode: "time", option: 30 }), id: "a", date: 1 },
      {
        ...makeEntry({ wpm: 90, mode: "words", option: 25 }),
        id: "b",
        date: 2,
      },
      { ...makeEntry({ wpm: 70, mode: "zen", option: 0 }), id: "c", date: 3 },
    ];

    it("keeps everything when filter is all and query is empty", () => {
      const out = filterHistory(entries, "all", "");
      expect(out).toHaveLength(3);
    });

    it("keeps only the matching mode", () => {
      const out = filterHistory(entries, "zen", "");
      expect(out).toEqual([entries[2]]);
    });

    it("applies the query on top of the filter", () => {
      const out = filterHistory(entries, "time", "80");
      expect(out).toEqual([entries[0]]);
      const none = filterHistory(entries, "time", "999");
      expect(none).toEqual([]);
    });

    it("applies the query when the filter is all", () => {
      const out = filterHistory(entries, "all", "90");
      expect(out).toEqual([entries[1]]);
    });
  });
});
