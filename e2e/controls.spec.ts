import { test, expect } from "@playwright/test";

test("tooltip appears on toolbar buttons after hover", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "punctuation", exact: true }).hover();

  await expect(
    page.getByRole("tooltip", { name: "punctuation (p)" })
  ).toBeVisible();
});

test("active toolbar toggle gets the glow state", async ({ page }) => {
  await page.goto("/");

  const numbers = page.getByRole("button", { name: "numbers", exact: true });
  await expect(numbers).toHaveAttribute("aria-pressed", "false");

  await numbers.click();
  await expect(numbers).toHaveAttribute("aria-pressed", "true");
  await expect(numbers).toHaveClass(/rounded-full/);
  await expect(numbers).toHaveClass(/shadow-/);
});

test("header buttons share the outline pill variant", async ({ page }) => {
  await page.goto("/");

  for (const name of ["History", "Stats", "Settings", "Toggle theme"]) {
    const btn = page.getByRole("button", { name, exact: true });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveClass(/rounded-full/);
    await expect(btn).toHaveClass(/border/);
  }
});

test("history filters are pill toggles with tooltips", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "History", exact: true }).click();
  const all = page.getByRole("button", { name: "all", exact: true });
  await expect(all).toBeVisible();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveClass(/rounded-full/);

  await all.hover();
  await expect(
    page.getByRole("tooltip", { name: "filter: all" })
  ).toBeVisible();
});
