import { describe, expect, it } from "vitest";
import { ES_ACCENT_PRACTICE_WORDS, ES_COMMON_WORDS } from "@/lib/words-es";
import {
  generateWords,
  getAccentPracticePool,
  getWordPool,
  LANGUAGES,
  LONG_WORDS,
  type Language,
} from "@/lib/words";

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

describe("language pools", () => {
  const languages: Language[] = ["en", "es", "pt"];

  it("exposes english, spanish and portuguese", () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(["en", "es", "pt"]);
  });

  it("pools have no duplicates", () => {
    for (const lang of languages) {
      for (const long of [false, true]) {
        const pool = getWordPool(lang, long);
        expect(new Set(pool).size).toBe(pool.length);
      }
    }
  });

  it("generates words from the requested pool", () => {
    for (const lang of languages) {
      const words = generateWords(150, { language: lang });
      const pool = new Set(getWordPool(lang, false));
      expect(words).toHaveLength(150);
      for (const w of words) {
        expect(pool.has(w)).toBe(true);
      }
    }
  });

  it("derives long-word pools for es/pt from the common pool", () => {
    for (const lang of ["es", "pt"] as Language[]) {
      const long = getWordPool(lang, true);
      expect(long.length).toBeGreaterThan(0);
      for (const w of long) {
        expect(w.length).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("spanish pool contains accented words", () => {
    const pool = getWordPool("es", false);
    expect(pool.some((w) => /[áéíóúüñ]/.test(w))).toBe(true);
  });
});

describe("accent practice", () => {
  it("pool has no duplicates", () => {
    const pool = getAccentPracticePool();
    expect(new Set(pool).size).toBe(pool.length);
  });

  it("every pool word carries a diacritic", () => {
    for (const w of getAccentPracticePool()) {
      expect(w).toMatch(/[áéíóúüñÁÉÍÓÚÜÑ]/);
    }
  });

  it("pool includes the dedicated accent words and accented commons", () => {
    const pool = new Set(getAccentPracticePool());
    expect(ES_ACCENT_PRACTICE_WORDS.length).toBeGreaterThan(0);
    for (const w of ES_ACCENT_PRACTICE_WORDS) {
      expect(pool.has(w)).toBe(true);
    }
    for (const w of ES_COMMON_WORDS.filter((w) => /[áéíóúüñÁÉÍÓÚÜÑ]/.test(w))) {
      expect(pool.has(w)).toBe(true);
    }
  });

  it("generates only accented words in accentPractice mode", () => {
    const pool = new Set(getAccentPracticePool());
    const words = generateWords(200, { accentPractice: true });
    expect(words).toHaveLength(200);
    for (const w of words) {
      expect(pool.has(w)).toBe(true);
      expect(w).toMatch(/[áéíóúüñÁÉÍÓÚÜÑ]/);
    }
  });
});
