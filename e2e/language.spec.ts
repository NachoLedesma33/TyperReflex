import { test, expect, type Page } from "@playwright/test";
import { getAccentPracticePool, getWordPool } from "../src/lib/words";

function currentWordInPool(page: Page, pool: Set<string>) {
  return expect
    .poll(async () => {
      const el = page.locator(".border-typer-word-border").first();
      const text = (await el.textContent()) ?? "";
      return pool.has(text);
    })
    .toBe(true);
}

test("language selector switches the word pool", async ({ page }) => {
  await page.goto("/");
  const esPool = new Set(getWordPool("es", false));
  const ptPool = new Set(getWordPool("pt", false));

  await page.getByRole("button", { name: "es", exact: true }).click();
  await currentWordInPool(page, esPool);

  await page.getByRole("button", { name: "pt", exact: true }).click();
  await currentWordInPool(page, ptPool);
});

test("language persists after reload", async ({ page }) => {
  await page.goto("/");
  const esPool = new Set(getWordPool("es", false));

  await page.getByRole("button", { name: "es", exact: true }).click();
  await currentWordInPool(page, esPool);

  await page.reload();
  await currentWordInPool(page, esPool);
});

test("language cycles with the i shortcut while idle", async ({ page }) => {
  await page.goto("/");
  const esPool = new Set(getWordPool("es", false));

  // The typing input auto-focuses on mount; blur so the global shortcut
  // sees a non-editable target (typing always wins in the input).
  await expect(page.getByLabel("Typing input")).toBeFocused();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.keyboard.press("i");
  await currentWordInPool(page, esPool);
});

test("accent practice forces spanish accented words", async ({ page }) => {
  await page.goto("/");
  const accentPool = new Set(getAccentPracticePool());

  await page.getByRole("button", { name: "accents" }).click();
  await currentWordInPool(page, accentPool);

  await expect(
    page.getByRole("button", { name: "es", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
});

test("switching language turns accent practice off", async ({ page }) => {
  await page.goto("/");
  const ptPool = new Set(getWordPool("pt", false));

  await page.getByRole("button", { name: "accents" }).click();
  await expect(page.getByRole("button", { name: "accents" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.getByRole("button", { name: "pt", exact: true }).click();
  await expect(page.getByRole("button", { name: "accents" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await currentWordInPool(page, ptPool);
});
