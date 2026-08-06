import { describe, expect, it } from "vitest";
import {
  calcResults,
  charsMatch,
  computeLiveWpm,
  getCharStatuses,
  normalizeKey,
  wordHasError,
} from "@/lib/typing";

describe("getCharStatuses", () => {
  it("marks matching chars as correct", () => {
    expect(getCharStatuses("abc", "abc")).toEqual([
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("marks mismatches as incorrect and untripped tail as untyped", () => {
    expect(getCharStatuses("abc", "ax")).toEqual([
      "correct",
      "incorrect",
      "untyped",
    ]);
  });

  it("marks trailing extra chars beyond the word", () => {
    expect(getCharStatuses("abc", "abcd")).toEqual([
      "correct",
      "correct",
      "correct",
      "extra",
    ]);
  });

  it("marks everything untyped for an empty input", () => {
    expect(getCharStatuses("abc", "")).toEqual([
      "untyped",
      "untyped",
      "untyped",
    ]);
  });
});

describe("wordHasError", () => {
  it("returns false for an exact match", () => {
    expect(wordHasError("hello", "hello")).toBe(false);
  });

  it("returns true for a length mismatch", () => {
    expect(wordHasError("hello", "hell")).toBe(true);
    expect(wordHasError("hello", "helloo")).toBe(true);
  });

  it("returns true for a wrong char", () => {
    expect(wordHasError("hello", "hallo")).toBe(true);
  });
});

describe("calcResults", () => {
  it("computes a perfect 12 wpm test over 60s", () => {
    const completed = Array.from({ length: 12 }, () => ({
      word: "hello",
      typed: "hello",
    }));
    const res = calcResults(completed, 60);
    expect(res.correctChars).toBe(60);
    expect(res.rawWpm).toBe(14); // 60 typed + 12 spaces = 72 chars -> 72/5 = 14.4 -> 14
    expect(res.wpm).toBe(12); // 60 correct chars -> 60/5 = 12
    expect(res.accuracy).toBe(100);
    expect(res.incorrectChars).toBe(0);
    expect(res.extraChars).toBe(0);
    expect(res.time).toBe(60);
  });

  it("counts incorrect, extra and missed chars", () => {
    const completed = [
      { word: "cat", typed: "car" }, // c,a correct, t->r incorrect
      { word: "dog", typed: "dogg" }, // 3 correct + 1 extra
      { word: "bird", typed: "bi" }, // b,i correct, r,d missed (incorrect)
    ];
    const res = calcResults(completed, 30);
    expect(res.correctChars).toBe(7);
    expect(res.incorrectChars).toBe(3);
    expect(res.extraChars).toBe(1);
    expect(res.accuracy).toBe(Math.round((7 / 10) * 100));
  });

  it("handles the zero-second edge case without dividing by zero", () => {
    const res = calcResults([{ word: "ab", typed: "ab" }], 0);
    expect(res.wpm).toBe(400); // 2/5/0.001
    expect(res.rawWpm).toBe(600); // 3/5/0.001
  });

  it("returns 100 accuracy for an empty run", () => {
    const res = calcResults([], 60);
    expect(res.accuracy).toBe(100);
    expect(res.wpm).toBe(0);
  });

  it("counts corrected mistakes toward accuracy when a counter is provided", () => {
    // The word was corrected to its final state, but 2 keystrokes were
    // mistyped along the way and must still count.
    const res = calcResults([{ word: "hello", typed: "hello" }], 30, 2);
    expect(res.correctChars).toBe(5);
    expect(res.incorrectChars).toBe(0);
    expect(res.accuracy).toBe(Math.round((5 / 7) * 100));
  });

  it("falls back to final-state errors when no counter is provided", () => {
    const res = calcResults([{ word: "cat", typed: "car" }], 30);
    expect(res.correctChars).toBe(2);
    expect(res.incorrectChars).toBe(1);
    expect(res.accuracy).toBe(67); // 2 correct of 3 attempted
  });
});

describe("computeLiveWpm", () => {
  it("computes wpm and raw wpm from completed words", () => {
    const { wpm, rawWpm } = computeLiveWpm(
      [{ word: "test", typed: "test" }],
      30
    );
    // 4 correct chars -> 4/5/0.5 = 1.6 -> round 2
    expect(wpm).toBe(2);
    // 4 typed + 1 space = 5 chars -> 5/5/0.5 = 2
    expect(rawWpm).toBe(2);
  });

  it("ignores incorrect chars for wpm", () => {
    const { wpm } = computeLiveWpm([{ word: "abc", typed: "xyz" }], 60);
    expect(wpm).toBe(0);
  });
});

describe("accent handling", () => {
  it("normalizeKey strips diacritics and lowercases", () => {
    expect(normalizeKey("Á")).toBe("a");
    expect(normalizeKey("ñ")).toBe("n");
    expect(normalizeKey("Ü")).toBe("u");
  });

  it("charsMatch is exact by default", () => {
    expect(charsMatch("ó", "o")).toBe(false);
    expect(charsMatch("a", "a")).toBe(true);
  });

  it("charsMatch ignores accents when insensitive", () => {
    expect(charsMatch("ó", "o", true)).toBe(true);
    expect(charsMatch("ñ", "n", true)).toBe(true);
    expect(charsMatch("ü", "u", true)).toBe(true);
  });

  it("getCharStatuses treats accent-typed chars as correct when insensitive", () => {
    expect(getCharStatuses("corazón", "corazon", true)).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
    expect(getCharStatuses("corazón", "corazon")).toContain("incorrect");
  });

  it("wordHasError is accent-insensitive aware", () => {
    expect(wordHasError("corazón", "corazon", true)).toBe(false);
    expect(wordHasError("corazón", "corazon")).toBe(true);
  });
});
