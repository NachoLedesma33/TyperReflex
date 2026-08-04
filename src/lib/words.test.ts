import { describe, expect, it } from "vitest";
import { generateWords, LONG_WORDS } from "@/lib/words";

describe("generateWords", () => {
  it("returns exactly the requested count", () => {
    expect(generateWords(0)).toHaveLength(0);
    expect(generateWords(10)).toHaveLength(10);
    expect(generateWords(250)).toHaveLength(250);
  });

  it("defaults to lowercase common words with no punctuation or digits", () => {
    const words = generateWords(200);
    for (const w of words) {
      expect(w).toMatch(/^[a-z]+$/);
    }
  });

  it("only generates digits in onlyNumbers mode", () => {
    const words = generateWords(150, { onlyNumbers: true });
    for (const w of words) {
      expect(w).toMatch(/^\d{2,4}$/);
    }
  });

  it("only generates symbols in onlySymbols mode", () => {
    const allowed = new Set("!@#$%^&*()-_=+[]{}:;,./?".split(""));
    const words = generateWords(150, { onlySymbols: true });
    for (const w of words) {
      expect(w.length).toBeGreaterThan(0);
      for (const c of w) {
        expect(allowed.has(c)).toBe(true);
      }
    }
  });

  it("never repeats the same word twice in a row", () => {
    const words = generateWords(200);
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1]);
    }
  });

  it("adds valid punctuation when enabled", () => {
    const punctuation = new Set(",.!?;:".split(""));
    const words = generateWords(300, { punctuation: true });
    const punctuated = words.filter((w) => !/^[a-z]+$/.test(w));
    expect(punctuated.length).toBeGreaterThan(0);
    for (const w of punctuated) {
      const last = w[w.length - 1];
      expect(punctuation.has(last)).toBe(true);
      expect(w.slice(0, -1)).toMatch(/^[a-z]+$/);
    }
  });

  it("capitalizes some words when enabled", () => {
    const words = generateWords(400, { capitals: true });
    const capped = words.filter((w) => /^[A-Z]/.test(w));
    expect(capped.length).toBeGreaterThan(0);
  });

  it("uses long words only when requested", () => {
    const words = generateWords(150, { longWords: true });
    for (const w of words) {
      expect(LONG_WORDS).toContain(w);
    }
  });
});
