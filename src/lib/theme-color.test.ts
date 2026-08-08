import { describe, expect, it } from "vitest";

import { oklchToHex, resolveThemeColor, syncThemeColor } from "./theme-color";

describe("oklchToHex", () => {
  it("converts neutral light gray", () => {
    expect(oklchToHex("oklch(0.95 0 0)")).toBe("#eeeeee");
  });

  it("converts the dark warm background", () => {
    expect(oklchToHex("oklch(0.13 0.018 16)")).toBe("#0d0505");
  });

  it("converts lavender dark", () => {
    expect(oklchToHex("oklch(0.2 0.02 303)")).toBe("#18141e");
  });

  it("converts lavender light", () => {
    expect(oklchToHex("oklch(0.78 0.02 303)")).toBe("#bab5c2");
  });

  it("converts sand dark", () => {
    expect(oklchToHex("oklch(0.21 0.02 60)")).toBe("#1f160f");
  });

  it("ignores an alpha channel", () => {
    expect(oklchToHex("oklch(0.2 0.02 303 / 0.8)")).toBe("#18141e");
  });

  it("accepts the browser-serialized percentage form", () => {
    expect(oklchToHex("oklch(13% .018 16)")).toBe("#0d0505");
    expect(oklchToHex("oklch(95% 0 0)")).toBe("#eeeeee");
  });

  it("accepts extra whitespace and casing", () => {
    expect(oklchToHex("  OKLCH(0.2   0.02   303)  ")).toBe("#18141e");
  });

  it("returns null for invalid input", () => {
    expect(oklchToHex("rgb(1, 2, 3)")).toBeNull();
    expect(oklchToHex("oklch(0.2)")).toBeNull();
    expect(oklchToHex("")).toBeNull();
  });
});

describe("syncThemeColor", () => {
  it("writes the resolved background into the theme-color meta", () => {
    document.documentElement.style.setProperty(
      "--background",
      "oklch(0.13 0.018 16)"
    );
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);

    syncThemeColor();

    expect(meta.getAttribute("content")).toBe("#0d0505");
    document.documentElement.style.removeProperty("--background");
    meta.remove();
  });

  it("leaves the meta untouched when no background is resolved", () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("content", "#f2f2f2");
    document.head.appendChild(meta);

    syncThemeColor();

    expect(meta.getAttribute("content")).toBe("#f2f2f2");
    meta.remove();
  });

  it("is a no-op without a theme-color meta", () => {
    expect(() => syncThemeColor()).not.toThrow();
  });
});

describe("resolveThemeColor", () => {
  it("resolves from the inline --background variable", () => {
    document.documentElement.style.setProperty(
      "--background",
      "oklch(0.2 0.02 303)"
    );
    expect(resolveThemeColor()).toBe("#18141e");
    document.documentElement.style.removeProperty("--background");
  });

  it("returns null when the variable is missing", () => {
    document.documentElement.style.removeProperty("--background");
    expect(resolveThemeColor()).toBeNull();
  });
});
