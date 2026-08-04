import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme-provider";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const STORAGE_KEY = "typerreflex-theme";

function makeMatchMedia(matches: boolean) {
  return (query: string) => ({
    matches: query === DARK_QUERY ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

function renderProvider(props?: {
  defaultTheme?: "dark" | "light" | "system";
}) {
  return render(
    <ThemeProvider
      defaultTheme={props?.defaultTheme ?? "light"}
      storageKey={STORAGE_KEY}
      disableTransitionOnChange={false}
    >
      <div>app</div>
    </ThemeProvider>
  );
}

describe("ThemeProvider", () => {
  it("applies the default theme class to the root element", () => {
    renderProvider({ defaultTheme: "light" });
    expect(document.documentElement).toHaveClass("light");
  });

  it("toggles between dark and light with the d key and persists it", async () => {
    const user = userEvent.setup();
    renderProvider({ defaultTheme: "light" });

    await user.keyboard("{d}");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");

    await user.keyboard("{d}");
    expect(document.documentElement).toHaveClass("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("resolves the system theme when default is system", () => {
    const spy = vi
      .spyOn(window, "matchMedia")
      .mockImplementation(makeMatchMedia(true));
    renderProvider({ defaultTheme: "system" });
    expect(document.documentElement).toHaveClass("dark");
    spy.mockRestore();
  });

  it("reads the persisted theme from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderProvider({ defaultTheme: "light" });
    expect(document.documentElement).toHaveClass("dark");
  });

  it("does not toggle when typing inside an editable target", async () => {
    const user = userEvent.setup();
    renderProvider({ defaultTheme: "light" });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    await user.keyboard("d");
    expect(document.documentElement).toHaveClass("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    input.remove();
  });
});
