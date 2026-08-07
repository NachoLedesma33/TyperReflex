import { test, expect } from "@playwright/test";
import { setWordsMode, typeCurrentWord } from "./helpers";

test("running test shows shimmer on the progress bar and glow on the active word", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await area.click();
  await typeCurrentWord(page);
  await typeCurrentWord(page);

  await expect(page.locator('[role="progressbar"] > div')).toHaveClass(
    /typer-progress-glow/
  );
  await expect(page.locator(".border-typer-word-border")).toHaveClass(
    /typer-word-glow/
  );
});

test("pause overlay fades in", async ({ page }) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await area.click();
  await typeCurrentWord(page);

  await page.keyboard.press("Escape");
  const resume = page.getByRole("button", { name: "resume" });
  await expect(resume).toBeVisible();
  await expect(resume).toHaveClass(/typer-fade-in/);

  await page.keyboard.press("Escape");
  await expect(resume).not.toBeVisible();
});

test("results fade in with a staggered layout and wpm counts up to the final value", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await area.click();
  for (let i = 0; i < 10; i++) {
    await typeCurrentWord(page);
  }

  // The big wpm number fades in inside the header section
  const bigWpm = page.locator(".typer-fade-up .text-9xl");
  await expect(bigWpm).toBeVisible();

  // Actions row (restart/copy/…) is its own staggered section
  await expect(
    page.getByRole("button", { name: "restart" }).locator("..")
  ).toHaveClass(/typer-fade-up/);

  // The count-up animates until it reaches the value announced in the sr-only status
  const status = await page.locator('p[role="status"]').textContent();
  const finalWpm = Number(status?.match(/wpm (\d+)/)?.[1]);
  expect(Number.isFinite(finalWpm)).toBe(true);
  await expect
    .poll(() => bigWpm.textContent(), { timeout: 10_000 })
    .toBe(String(finalWpm));
});
