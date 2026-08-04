import { test, expect } from "@playwright/test";
import { setWordsMode } from "./helpers";

test("toolbar stays usable on a mobile viewport without horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  const hasOverflow = () =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
  expect(await hasOverflow()).toBe(false);

  // All option and mode buttons are visible and reachable
  for (const name of [
    "punctuation",
    "numbers",
    "capitals",
    "long",
    "number",
    "symbol",
    "time",
    "words",
    "zen",
  ]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }

  await setWordsMode(page, 10);
  await area.click();
  await page.keyboard.type("a");
  expect(await hasOverflow()).toBe(false);
});
