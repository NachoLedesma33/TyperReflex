import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  applyCssVars,
  deletePreset,
  FONT_OPTIONS,
  FONT_STACKS,
  loadSettings,
  savePreset,
} from "@/lib/settings";

const STORAGE_KEY = "typerreflex-settings";
const PRESETS_KEY = "typerreflex-presets";

describe("loadSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values over defaults", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ palette: "ocean", fontSize: 1.5 })
    );
    const s = loadSettings();
    expect(s.palette).toBe("ocean");
    expect(s.fontSize).toBe(1.5);
    expect(s.themeId).toBe(DEFAULT_SETTINGS.themeId);
  });

  it("migrates the legacy 'default' font to 'jetbrains'", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontFamily: "default" })
    );
    expect(loadSettings().fontFamily).toBe("jetbrains");
  });

  it("preserves a stored non-default font", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontFamily: "space" })
    );
    expect(loadSettings().fontFamily).toBe("space");
  });

  it("defaults to english with accents distinguished", () => {
    expect(DEFAULT_SETTINGS.language).toBe("en");
    expect(DEFAULT_SETTINGS.accentInsensitive).toBe(false);
  });

  it("loads a stored language and accent preference", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language: "es", accentInsensitive: true })
    );
    const s = loadSettings();
    expect(s.language).toBe("es");
    expect(s.accentInsensitive).toBe(true);
  });

  it("falls back to english for an unknown stored language", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language: "fr" })
    );
    expect(loadSettings().language).toBe("en");
  });

  it("exposes a font stack for every option", () => {
    expect(FONT_OPTIONS).toHaveLength(5);
    for (const f of FONT_OPTIONS) {
      expect(FONT_STACKS[f.id]).toContain(f.name);
    }
  });

  it("falls back to defaults on corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("applyCssVars", () => {
  it("adds the theme class and applies font vars", () => {
    applyCssVars({ ...DEFAULT_SETTINGS, themeId: "lavender" });
    const root = document.documentElement;
    expect(root.classList.contains("theme-lavender")).toBe(true);
    expect(root.style.getPropertyValue("--font-mono")).toContain(
      "JetBrains Mono"
    );
    expect(root.style.getPropertyValue("--typer-word-gap-x")).toBe("0.9rem");
  });

  it("applies the chosen font stack", () => {
    applyCssVars({ ...DEFAULT_SETTINGS, fontFamily: "fira" });
    expect(
      document.documentElement.style.getPropertyValue("--font-mono")
    ).toContain("Fira Code");
  });

  it("removes the theme class for classic", () => {
    document.documentElement.classList.add("theme-sand");
    applyCssVars({ ...DEFAULT_SETTINGS, themeId: "classic" });
    expect(document.documentElement.classList.contains("theme-sand")).toBe(
      false
    );
  });

  it("applies palette vars", () => {
    applyCssVars({ ...DEFAULT_SETTINGS, palette: "matrix" });
    expect(
      document.documentElement.style.getPropertyValue("--primary")
    ).toBeTruthy();
  });
});

describe("presets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and deletes presets", () => {
    expect(savePreset("fast", DEFAULT_SETTINGS)).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(PRESETS_KEY)!)).toHaveLength(
      1
    );
    const afterDelete = deletePreset("fast");
    expect(afterDelete).toHaveLength(0);
  });

  it("deduplicates presets by name", () => {
    savePreset("p", { ...DEFAULT_SETTINGS, palette: "amber" });
    const next = savePreset("p", { ...DEFAULT_SETTINGS, palette: "ocean" });
    expect(next).toHaveLength(1);
    expect(next[0].settings.palette).toBe("ocean");
  });
});
