import { describe, expect, it } from "vitest";
import {
  bindingLabel,
  eventToBinding,
  matchesBinding,
  parseBinding,
  sanitizeShortcuts,
  serializeBinding,
  SHORTCUT_ACTIONS,
} from "@/lib/shortcuts";

describe("parseBinding", () => {
  it("parses a bare key", () => {
    expect(parseBinding("d")).toEqual({
      key: "d",
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    });
  });

  it("parses modifiers in any order and canonicalizes aliases", () => {
    const b = parseBinding("shift+ctrl+k");
    expect(b).toEqual({
      key: "k",
      ctrl: true,
      alt: false,
      shift: true,
      meta: false,
    });
    expect(parseBinding("control+cmd+p")).toEqual({
      key: "p",
      ctrl: true,
      alt: false,
      shift: false,
      meta: true,
    });
  });

  it("maps special keys", () => {
    expect(parseBinding("escape")?.key).toBe("escape");
    expect(parseBinding("ArrowUp")?.key).toBe("arrowup");
    expect(parseBinding(" ")).not.toBeNull();
    expect(parseBinding(" ")!.key).toBe("space");
    expect(parseBinding("F5")?.key).toBe("f5");
  });

  it("rejects unknown modifiers and empty input", () => {
    expect(parseBinding("")).toBeNull();
    expect(parseBinding("x+d")).toBeNull();
    expect(parseBinding("d+")).toBeNull();
    expect(parseBinding("ctrl+")).toBeNull();
  });
});

describe("serializeBinding / bindingLabel", () => {
  it("round-trips a binding", () => {
    const parsed = parseBinding("ctrl+alt+shift+meta+m");
    expect(parsed).not.toBeNull();
    expect(serializeBinding(parsed!)).toBe("ctrl+alt+shift+meta+m");
  });

  it("serializes modifiers in canonical order", () => {
    expect(serializeBinding(parseBinding("shift+ctrl+k")!)).toBe(
      "ctrl+shift+k"
    );
  });

  it("formats a human label", () => {
    expect(bindingLabel("ctrl+shift+k")).toBe("Ctrl+Shift+K");
    expect(bindingLabel("d")).toBe("D");
    expect(bindingLabel("escape")).toBe("Esc");
    expect(bindingLabel("ctrl+arrowup")).toBe("Ctrl+↑");
  });
});

describe("eventToBinding", () => {
  it("builds a binding from a plain keydown", () => {
    const e = new KeyboardEvent("keydown", { key: "m" });
    expect(eventToBinding(e)).toBe("m");
  });

  it("includes pressed modifiers", () => {
    const e = new KeyboardEvent("keydown", { key: "M", shiftKey: true });
    expect(eventToBinding(e)).toBe("shift+m");
  });

  it("returns null for a bare modifier press", () => {
    expect(
      eventToBinding(new KeyboardEvent("keydown", { key: "Shift" }))
    ).toBeNull();
    expect(
      eventToBinding(new KeyboardEvent("keydown", { key: "Control" }))
    ).toBeNull();
  });
});

describe("matchesBinding", () => {
  it("matches the exact key without modifiers", () => {
    const e = new KeyboardEvent("keydown", { key: "d" });
    expect(matchesBinding(e, "d")).toBe(true);
    expect(matchesBinding(e, "ctrl+d")).toBe(false);
  });

  it("requires matching modifiers", () => {
    const plain = new KeyboardEvent("keydown", { key: "k" });
    const combo = new KeyboardEvent("keydown", { key: "K", ctrlKey: true });
    expect(matchesBinding(combo, "ctrl+k")).toBe(true);
    expect(matchesBinding(plain, "ctrl+k")).toBe(false);
    expect(matchesBinding(combo, "shift+ctrl+k")).toBe(false);
  });

  it("matches special keys case-insensitively", () => {
    const e = new KeyboardEvent("keydown", { key: "Escape" });
    expect(matchesBinding(e, "escape")).toBe(true);
  });

  it("ignores repeated keydowns", () => {
    const e = new KeyboardEvent("keydown", { key: "m", repeat: true });
    expect(matchesBinding(e, "m")).toBe(false);
  });
});

describe("sanitizeShortcuts", () => {
  it("drops unknown actions and invalid bindings", () => {
    const raw = {
      theme: "d",
      notAnAction: "x",
      punctuation: "not-a-valid-binding",
      capitals: "ctrl+shift+",
    };
    expect(sanitizeShortcuts(raw)).toEqual({ theme: "d" });
  });

  it("canonicalizes valid bindings", () => {
    expect(sanitizeShortcuts({ numbers: "shift+ctrl+N" })).toEqual({
      numbers: "ctrl+shift+n",
    });
  });

  it("returns an empty map for garbage", () => {
    expect(sanitizeShortcuts(null)).toEqual({});
    expect(sanitizeShortcuts("theme")).toEqual({});
    expect(sanitizeShortcuts(42)).toEqual({});
  });

  it("knows every action id", () => {
    const ids = SHORTCUT_ACTIONS.map((a) => a.id);
    expect(ids).toContain("theme");
    expect(ids).toContain("option4");
  });
});
