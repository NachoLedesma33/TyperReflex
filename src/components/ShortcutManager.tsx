// Global keyboard-shortcut dispatcher. Reads the configured shortcuts from
// settings (all off by default) and re-emits a matched keydown as a
// `typerreflex-shortcut` CustomEvent whose `detail` is the action id. The
// theme action is handled here; typing actions are handled by TypingTest.

import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  SHORTCUT_EVENT,
  isEditableTarget,
  matchesBinding,
  type ShortcutActionId,
} from "@/lib/shortcuts";
import { useSettings } from "@/lib/settings";

function toggleTheme(current: "dark" | "light" | "system"): "dark" | "light" {
  if (current === "dark") return "light";
  if (current === "light") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "light"
    : "dark";
}

export function ShortcutManager() {
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const shortcuts = settings.shortcuts;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      for (const [id, binding] of Object.entries(shortcuts)) {
        if (binding && matchesBinding(e, binding)) {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent<ShortcutActionId>(SHORTCUT_EVENT, {
              detail: id as ShortcutActionId,
            })
          );
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);

  useEffect(() => {
    const onShortcut = (e: Event) => {
      if ((e as CustomEvent<ShortcutActionId>).detail === "theme") {
        setTheme(toggleTheme(theme));
      }
    };
    window.addEventListener(SHORTCUT_EVENT, onShortcut);
    return () => window.removeEventListener(SHORTCUT_EVENT, onShortcut);
  }, [setTheme, theme]);

  return null;
}
