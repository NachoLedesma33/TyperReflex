/* eslint-disable react-refresh/only-export-components */
import * as React from "react";

export type PaletteId =
  "crimson" | "ocean" | "forest" | "violet" | "amber" | "matrix" | "gruvbox";

export interface Palette {
  id: PaletteId;
  name: string;
  vars: Record<string, string>;
}

export const PALETTES: Palette[] = [
  {
    id: "crimson",
    name: "Crimson",
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

export type FontId = "default" | "jetbrains" | "ibmplex";

export const FONT_STACKS: Record<Exclude<FontId, "default">, string> = {
  jetbrains:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  ibmplex:
    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

export const FONT_OPTIONS: { id: FontId; name: string }[] = [
  { id: "jetbrains", name: "JetBrains Mono" },
  { id: "ibmplex", name: "IBM Plex Mono" },
];

export interface Settings {
  fontFamily: FontId;
  fontSize: number;
  wordGap: number;
  soundEnabled: boolean;
  palette: PaletteId;
  themeId: ThemeId;
  caretStyle: "bar" | "block";
  shakeEnabled: boolean;
}

const STORAGE_KEY = "typerreflex-settings";
const PRESETS_KEY = "typerreflex-presets";

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: "jetbrains",
  fontSize: 2.125,
  wordGap: 0.7,
  soundEnabled: false,
  palette: "crimson",
  themeId: "classic",
  caretStyle: "bar",
  shakeEnabled: false,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (parsed.fontFamily === "default") {
      parsed.fontFamily = "jetbrains";
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
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

function applyCssVars(settings: Settings) {
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

  if (settings.fontFamily === "default") {
    root.style.removeProperty("--font-mono");
  } else {
    root.style.setProperty("--font-mono", FONT_STACKS[settings.fontFamily]);
  }

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
