import { test, expect } from "@playwright/test";

test("theme toggles with the d key and persists after reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/light/);

  // The typing input auto-focuses on mount; blur so the global `d` shortcut
  // sees a non-editable target and actually toggles the theme.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.keyboard.press("d");
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    await page.evaluate(() => localStorage.getItem("typerreflex-theme"))
  ).toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    await page.evaluate(() => localStorage.getItem("typerreflex-theme"))
  ).toBe("dark");
});

test("stored settings are applied on load", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "typerreflex-settings",
      JSON.stringify({
        fontFamily: "ibmplex",
        fontSize: 1.5,
        wordGap: 0.5,
        soundEnabled: false,
        palette: "ocean",
        themeId: "lavender",
        caretStyle: "block",
        shakeEnabled: false,
      })
    );
  });

  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/theme-lavender/);

  const cssVars = await page.evaluate(() => ({
    fontMono: getComputedStyle(document.documentElement).getPropertyValue(
      "--font-mono"
    ),
    fontSize: getComputedStyle(document.documentElement).getPropertyValue(
      "--typer-font-size"
    ),
  }));
  expect(cssVars.fontMono).toContain("IBM Plex Mono");
  expect(cssVars.fontSize).toContain("1.5rem");
});

test("settings survive a reload when changed at runtime", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "typerreflex-settings",
      JSON.stringify({
        fontFamily: "ibmplex",
        fontSize: 1.5,
        wordGap: 0.5,
        soundEnabled: false,
        palette: "ocean",
        themeId: "lavender",
        caretStyle: "block",
        shakeEnabled: false,
      })
    );
  });

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/theme-lavender/);
  const fontMono = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--font-mono")
  );
  expect(fontMono).toContain("IBM Plex Mono");
});
