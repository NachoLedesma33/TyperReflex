// Configurable keyboard shortcuts. A shortcut is stored as a canonical string
// like "ctrl+shift+k" (modifiers first, then the key, joined by "+"). Nothing
// is bound by default: the user opts in per action from the settings dialog.

export type ShortcutActionId =
  | "theme"
  | "punctuation"
  | "numbers"
  | "capitals"
  | "longWords"
  | "modeCycle"
  | "languageCycle"
  | "option1"
  | "option2"
  | "option3"
  | "option4";

export interface ShortcutAction {
  id: ShortcutActionId;
  label: string;
  description: string;
}

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  { id: "theme", label: "toggle theme", description: "switch dark/light" },
  {
    id: "punctuation",
    label: "toggle punctuation",
    description: "",
  },
  { id: "numbers", label: "toggle numbers", description: "" },
  { id: "capitals", label: "toggle capitals", description: "" },
  { id: "longWords", label: "toggle long words", description: "" },
  {
    id: "modeCycle",
    label: "cycle mode",
    description: "time → words → zen",
  },
  {
    id: "languageCycle",
    label: "cycle language",
    description: "en → es → pt",
  },
  { id: "option1", label: "option 1", description: "first duration/words" },
  { id: "option2", label: "option 2", description: "second duration/words" },
  { id: "option3", label: "option 3", description: "third duration/words" },
  { id: "option4", label: "option 4", description: "fourth duration/words" },
];

export type ShortcutMap = Partial<Record<ShortcutActionId, string>>;

export const SHORTCUT_EVENT = "typerreflex-shortcut";

export interface ParsedBinding {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

const KEY_ALIASES: Record<string, string> = {
  control: "ctrl",
  cmd: "meta",
  command: "meta",
  super: "meta",
};

const KEY_LABELS: Record<string, string> = {
  escape: "Esc",
  backspace: "Bksp",
  delete: "Del",
  enter: "Enter",
  tab: "Tab",
  space: "Space",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

function normalizeKey(key: string): string | null {
  if (key === " ") {
    return "space";
  }
  if (key.length === 1) {
    return key.toLowerCase();
  }
  const lower = key.toLowerCase();
  const map: Record<string, string> = {
    escape: "escape",
    backspace: "backspace",
    delete: "delete",
    enter: "enter",
    tab: "tab",
    spacebar: "space",
    arrowup: "arrowup",
    arrowdown: "arrowdown",
    arrowleft: "arrowleft",
    arrowright: "arrowright",
  };
  if (map[lower]) {
    return map[lower];
  }
  if (/^f\d+$/.test(lower)) {
    return lower;
  }
  return null;
}

export function parseBinding(input: string): ParsedBinding | null {
  const parts = input.split("+");
  const rawKey = parts.pop();
  if (!rawKey) {
    return null;
  }
  const key = normalizeKey(rawKey);
  if (!key) {
    return null;
  }
  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  for (const part of parts) {
    const mod = part.trim().toLowerCase();
    if (mod === "ctrl" || mod === "control") {
      ctrl = true;
    } else if (mod === "alt") {
      alt = true;
    } else if (mod === "shift") {
      shift = true;
    } else if (
      mod === "meta" ||
      mod === "cmd" ||
      mod === "command" ||
      mod === "super"
    ) {
      meta = true;
    } else {
      return null;
    }
  }
  return { key, ctrl, alt, shift, meta };
}

export function serializeBinding(b: ParsedBinding): string {
  const parts: string[] = [];
  if (b.ctrl) parts.push("ctrl");
  if (b.alt) parts.push("alt");
  if (b.shift) parts.push("shift");
  if (b.meta) parts.push("meta");
  parts.push(b.key);
  return parts.join("+");
}

export function bindingLabel(input: string): string {
  const b = parseBinding(input);
  if (!b) {
    return input;
  }
  const parts: string[] = [];
  if (b.ctrl) parts.push("Ctrl");
  if (b.alt) parts.push("Alt");
  if (b.shift) parts.push("Shift");
  if (b.meta) parts.push("Cmd");
  parts.push(
    KEY_LABELS[b.key] ?? (b.key.length === 1 ? b.key.toUpperCase() : b.key)
  );
  return parts.join("+");
}

// Builds a canonical binding from a keydown event, or null when it is a bare
// modifier press (waiting for the actual key) or an unmappable key.
export function eventToBinding(e: KeyboardEvent): string | null {
  if (
    e.key in KEY_ALIASES ||
    e.key === "Control" ||
    e.key === "Shift" ||
    e.key === "Alt" ||
    e.key === "Meta"
  ) {
    return null;
  }
  const key = normalizeKey(e.key);
  if (!key) {
    return null;
  }
  return serializeBinding({
    key,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  });
}

export function matchesBinding(e: KeyboardEvent, input: string): boolean {
  const b = parseBinding(input);
  if (!b) {
    return false;
  }
  if (e.repeat) {
    return false;
  }
  if (
    b.ctrl !== e.ctrlKey ||
    b.alt !== e.altKey ||
    b.shift !== e.shiftKey ||
    b.meta !== e.metaKey
  ) {
    return false;
  }
  const key = normalizeKey(e.key);
  return key !== null && key === b.key;
}

// Typing always wins: shortcuts never fire while an editable element has focus.
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  );
}

export function sanitizeShortcuts(raw: unknown): ShortcutMap {
  const out: ShortcutMap = {};
  if (typeof raw !== "object" || raw === null) {
    return out;
  }
  const valid = new Set<ShortcutActionId>(SHORTCUT_ACTIONS.map((a) => a.id));
  for (const [key, value] of Object.entries(raw)) {
    const id = key as ShortcutActionId;
    if (valid.has(id) && typeof value === "string") {
      const parsed = parseBinding(value);
      if (parsed) {
        out[id] = serializeBinding(parsed);
      }
    }
  }
  return out;
}
