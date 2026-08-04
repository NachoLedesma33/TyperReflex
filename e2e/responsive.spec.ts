import { test, expect, type Page } from "@playwright/test";
import { setWordsMode } from "./helpers";

function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  );
}

test("toolbar stays usable on a mobile viewport without horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  expect(await hasHorizontalOverflow(page)).toBe(false);

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
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

test("layout survives 200% zoom (640×360) without horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto("/");

  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);

  // Core controls stay reachable and the test keeps working at high zoom
  await expect(
    page.getByRole("button", { name: "words", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "time", exact: true }).click();
  expect(await hasHorizontalOverflow(page)).toBe(false);

  await area.click();
  await page.keyboard.type("a");
  expect(await hasHorizontalOverflow(page)).toBe(false);
});
