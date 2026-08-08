/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { sanitizeShortcuts, type ShortcutMap } from "@/lib/shortcuts";
import { LANGUAGES, type Language } from "@/lib/words";

export { LANGUAGES };
export type { Language } from "@/lib/words";

export type PaletteId =
  "crimson" | "ocean" | "forest" | "violet" | "amber" | "matrix" | "gruvbox";

export interface Palette {
  id: PaletteId;
  name: string;
  hue: number;
  vars: Record<string, string>;
}

export const PALETTES: Palette[] = [
  {
    id: "crimson",
    name: "Crimson",
    hue: 22,
    vars: {
      "--primary": "oklch(0.52 0.22 22)",
      "--ring": "oklch(0.52 0.22 22)",
      "--typer-caret": "oklch(0.52 0.22 22)",
      "--typer-wrong": "oklch(0.52 0.25 22)",
      "--typer-wrong-dim": "oklch(0.68 0.14 22)",
      "--typer-extra": "oklch(0.48 0.22 25)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    hue: 250,
    vars: {
      "--primary": "oklch(0.52 0.14 250)",
      "--ring": "oklch(0.52 0.14 250)",
      "--typer-caret": "oklch(0.52 0.14 250)",
      "--typer-wrong": "oklch(0.55 0.18 25)",
      "--typer-wrong-dim": "oklch(0.68 0.12 25)",
      "--typer-extra": "oklch(0.48 0.16 25)",
    },
  },
  {
    id: "forest",
    name: "Forest",
    hue: 150,
    vars: {
      "--primary": "oklch(0.52 0.13 150)",
      "--ring": "oklch(0.52 0.13 150)",
      "--typer-caret": "oklch(0.52 0.13 150)",
      "--typer-wrong": "oklch(0.55 0.18 25)",
      "--typer-wrong-dim": "oklch(0.68 0.12 25)",
      "--typer-extra": "oklch(0.48 0.16 25)",
    },
  },
  {
    id: "violet",
    name: "Violet",
    hue: 290,
    vars: {
      "--primary": "oklch(0.52 0.18 290)",
      "--ring": "oklch(0.52 0.18 290)",
      "--typer-caret": "oklch(0.52 0.18 290)",
      "--typer-wrong": "oklch(0.55 0.18 25)",
      "--typer-wrong-dim": "oklch(0.68 0.12 25)",
      "--typer-extra": "oklch(0.48 0.16 25)",
    },
  },
  {
    id: "amber",
    name: "Amber",
    hue: 75,
    vars: {
      "--primary": "oklch(0.55 0.15 75)",
      "--ring": "oklch(0.55 0.15 75)",
      "--typer-caret": "oklch(0.55 0.15 75)",
      "--typer-wrong": "oklch(0.55 0.18 25)",
      "--typer-wrong-dim": "oklch(0.68 0.12 25)",
      "--typer-extra": "oklch(0.48 0.16 25)",
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    hue: 140,
    vars: {
      "--primary": "oklch(0.62 0.15 140)",
      "--ring": "oklch(0.62 0.15 140)",
      "--typer-caret": "oklch(0.62 0.15 140)",
      "--typer-wrong": "oklch(0.58 0.2 30)",
      "--typer-wrong-dim": "oklch(0.68 0.12 30)",
      "--typer-extra": "oklch(0.5 0.16 30)",
    },
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    hue: 55,
    vars: {
      "--primary": "oklch(0.66 0.13 55)",
      "--ring": "oklch(0.66 0.13 55)",
      "--typer-caret": "oklch(0.66 0.13 55)",
      "--typer-wrong": "oklch(0.58 0.2 25)",
      "--typer-wrong-dim": "oklch(0.68 0.12 25)",
      "--typer-extra": "oklch(0.5 0.16 25)",
    },
  },
];

export type ThemeId = "classic" | "lavender" | "sage" | "ocean" | "sand";

export interface Theme {
  id: ThemeId;
  name: string;
}

export const THEMES: Theme[] = [
  { id: "classic", name: "Classic gray" },
  { id: "lavender", name: "Lavender" },
  { id: "sage", name: "Sage" },
  { id: "ocean", name: "Ocean" },
  { id: "sand", name: "Sand" },
];

export type FontId =
  "jetbrains" | "fira" | "roboto" | "ibmplex" | "space" | "courier";

const FONT_FALLBACK =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export const FONT_STACKS: Record<FontId, string> = {
  jetbrains: `"JetBrains Mono", ${FONT_FALLBACK}`,
  fira: `"Fira Code", ${FONT_FALLBACK}`,
  roboto: `"Roboto Mono", ${FONT_FALLBACK}`,
  ibmplex: `"IBM Plex Mono", ${FONT_FALLBACK}`,
  space: `"Space Mono", ${FONT_FALLBACK}`,
  courier: `"Courier Prime", ${FONT_FALLBACK}`,
};

export const FONT_OPTIONS: { id: FontId; name: string }[] = [
  { id: "jetbrains", name: "JetBrains Mono" },
  { id: "fira", name: "Fira Code" },
  { id: "roboto", name: "Roboto Mono" },
  { id: "ibmplex", name: "IBM Plex Mono" },
  { id: "space", name: "Space Mono" },
  { id: "courier", name: "Courier Prime" },
];

// Per-font tuning so every mono face reads at the same visual density. Weight
// is only overridden for variable faces (interpolated); discrete faces keep 400.
export const FONT_METRICS: Record<
  FontId,
  { letterSpacing: string; weight: string }
> = {
  jetbrains: { letterSpacing: "0.02em", weight: "400" },
  fira: { letterSpacing: "0.025em", weight: "450" },
  roboto: { letterSpacing: "0.02em", weight: "450" },
  ibmplex: { letterSpacing: "0.015em", weight: "400" },
  space: { letterSpacing: "0.03em", weight: "400" },
  courier: { letterSpacing: "0.03em", weight: "400" },
};

export interface CustomTheme {
  hue: number;
  lightness: number;
}

export interface Settings {
  fontFamily: FontId;
  fontSize: number;
  wordGap: number;
  soundEnabled: boolean;
  ligatures: boolean;
  palette: PaletteId;
  themeId: ThemeId;
  caretStyle: "bar" | "block";
  shakeEnabled: boolean;
  confirmRestart: boolean;
  strictMode: boolean;
  language: Language;
  accentInsensitive: boolean;
  customTheme: CustomTheme | null;
  shortcuts: ShortcutMap;
}

const STORAGE_KEY = "typerreflex-settings";
const PRESETS_KEY = "typerreflex-presets";

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: "jetbrains",
  fontSize: 2.125,
  wordGap: 0.9,
  soundEnabled: false,
  ligatures: false,
  palette: "crimson",
  themeId: "classic",
  caretStyle: "bar",
  shakeEnabled: false,
  confirmRestart: false,
  strictMode: false,
  language: "en",
  accentInsensitive: false,
  customTheme: null,
  shortcuts: {},
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if ((parsed.fontFamily as string) === "default") {
      parsed.fontFamily = "jetbrains";
    }
    const lang = parsed.language;
    const language: Language =
      lang !== undefined && LANGUAGES.some((l) => l.id === lang) ? lang : "en";
    const ligatures =
      typeof parsed.ligatures === "boolean" ? parsed.ligatures : false;
    const shortcuts = sanitizeShortcuts(parsed.shortcuts);
    let customTheme: CustomTheme | null = null;
    const ct = parsed.customTheme;
    if (
      ct !== undefined &&
      ct !== null &&
      typeof ct === "object" &&
      typeof ct.hue === "number" &&
      typeof ct.lightness === "number" &&
      Number.isFinite(ct.hue) &&
      Number.isFinite(ct.lightness)
    ) {
      customTheme = {
        hue: Math.max(0, Math.min(360, ct.hue)),
        lightness: Math.max(0.2, Math.min(0.8, ct.lightness)),
      };
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language,
      customTheme,
      ligatures,
      shortcuts,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = React.createContext<SettingsContextValue | undefined>(
  undefined
);

export function applyCssVars(settings: Settings) {
  const root = document.documentElement;

  root.classList.remove(
    "theme-lavender",
    "theme-sage",
    "theme-ocean",
    "theme-sand"
  );
  if (settings.themeId !== "classic") {
    root.classList.add(`theme-${settings.themeId}`);
  }

  root.style.setProperty("--font-mono", FONT_STACKS[settings.fontFamily]);
  root.style.setProperty(
    "--typer-ligatures",
    settings.ligatures ? "normal" : "none"
  );
  const metrics = FONT_METRICS[settings.fontFamily];
  root.style.setProperty("--typer-letter-spacing", metrics.letterSpacing);
  root.style.setProperty("--typer-font-weight", metrics.weight);

  const fs = settings.fontSize;
  const minFs = Math.max(0.875, fs - 0.25);
  root.style.setProperty(
    "--typer-font-size",
    `clamp(${minFs}rem, ${fs - 0.75}rem + 2.2vw, ${fs}rem)`
  );
  root.style.setProperty(
    "--typer-line-height",
    "calc(var(--typer-font-size) * 1.85)"
  );

  root.style.setProperty("--typer-word-gap-x", `${settings.wordGap}rem`);

  const palette =
    PALETTES.find((p) => p.id === settings.palette) ?? PALETTES[0];
  for (const [key, value] of Object.entries(palette.vars)) {
    root.style.setProperty(key, value);
  }

  if (settings.customTheme) {
    const { hue, lightness } = settings.customTheme;
    const accent = `oklch(${lightness} 0.2 ${hue})`;
    root.style.setProperty("--primary", accent);
    root.style.setProperty("--ring", accent);
    root.style.setProperty("--typer-caret", accent);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings>(loadSettings);

  const updateSettings = React.useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    applyCssVars(settings);
  }, [settings]);

  const value = React.useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// ─── Presets ───────────────────────────────────────────────────────────────────

export interface SettingsPreset {
  name: string;
  settings: Partial<Settings>;
}

export function getPresets(): SettingsPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SettingsPreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is SettingsPreset =>
        typeof p === "object" &&
        p !== null &&
        typeof p.name === "string" &&
        typeof p.settings === "object"
    );
  } catch {
    return [];
  }
}

function persistPresets(presets: SettingsPreset[]): void {
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore storage errors
  }
}

export function savePreset(name: string, settings: Settings): SettingsPreset[] {
  const clean = name.trim();
  const presets = getPresets().filter((p) => p.name !== clean);
  const next: SettingsPreset[] = [
    ...presets,
    { name: clean, settings: { ...settings } },
  ];
  persistPresets(next);
  return next;
}

export function deletePreset(name: string): SettingsPreset[] {
  const next = getPresets().filter((p) => p.name !== name);
  persistPresets(next);
  return next;
}
