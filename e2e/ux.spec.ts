import { test, expect } from "@playwright/test";
import { setWordsMode, typeCurrentWord } from "./helpers";

const SETTINGS_KEY = "typerreflex-settings";

function seedSettings(overrides: Record<string, unknown>) {
  return (page: import("@playwright/test").Page) =>
    page.addInitScript(
      ([key, obj]) => {
        const existing = JSON.parse(localStorage.getItem(key) ?? "{}");
        localStorage.setItem(key, JSON.stringify({ ...existing, ...obj }));
      },
      [SETTINGS_KEY, overrides] as const
    );
}

test("esc pauses and resumes without losing the test", async ({ page }) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await area.click();
  await typeCurrentWord(page);
  await typeCurrentWord(page);
  await expect(page.getByText("2/10", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "resume" })).toBeVisible();
  await expect(page.getByText("paused", { exact: true })).toBeVisible();

  // Progress is preserved while paused
  await expect(page.getByText("2/10", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "resume" })).not.toBeVisible();

  for (let i = 0; i < 8; i++) {
    await typeCurrentWord(page);
  }
  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();
});

test("finish button ends a running test early and shows results", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await area.click();
  await typeCurrentWord(page);
  await typeCurrentWord(page);
  await expect(page.getByText("2/10", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "finish", exact: true }).click();

  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();
});

test("strict mode keeps the test on a word until it is corrected", async ({
  page,
}) => {
  await seedSettings({ strictMode: true })(page);
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await area.click();

  // A wrong word + space must NOT advance in strict mode
  await page.keyboard.type("zz ", { delay: 10 });
  await expect(page.getByText("0/10", { exact: true })).toBeVisible();

  // Clear the rejected input, then type the 10 words correctly
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  for (let i = 0; i < 10; i++) {
    await typeCurrentWord(page);
  }
  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();
});

test("tab shows a restart confirmation when enabled and there is progress", async ({
  page,
}) => {
  await seedSettings({ confirmRestart: true })(page);
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await area.click();
  await typeCurrentWord(page);
  await expect(page.getByText("1/10", { exact: true })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByText("restart? progress will be lost")).toBeVisible();

  // Cancel keeps the running test intact
  await page.getByRole("button", { name: "cancel" }).click();
  await expect(page.getByText("1/10", { exact: true })).toBeVisible();

  // Confirming actually restarts to a fresh idle test
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "restart" }).click();
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await expect(page.getByText("1/10", { exact: true })).not.toBeVisible();
});

test("first-time onboarding hint disappears after the first keystroke", async ({
  page,
}) => {
  await page.goto("/");
  const hint = page.getByText("click here and start typing");
  await expect(hint).toBeVisible();

  const area = page.getByRole("textbox", { name: "Typing area" });
  await area.click();
  await page.keyboard.type("a");

  await expect(hint).not.toBeVisible();
});

test("focus mode hides the header/toolbar while typing and restores them on pause", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator("header");
  const toolbar = page.getByRole("button", { name: "punctuation" });
  await expect(header).toHaveCSS("opacity", "1");
  await expect(toolbar).toBeVisible();

  const area = page.getByRole("textbox", { name: "Typing area" });
  await area.click();
  await page.keyboard.type("a");

  await expect(header).toHaveCSS("opacity", "0");
  await expect(toolbar).not.toBeVisible();

  // Pausing brings the UI back
  await page.keyboard.press("Escape");
  await expect(header).toHaveCSS("opacity", "1");
  await expect(toolbar).toBeVisible();

  // Resuming hides it again, and resetting restores it
  await page.keyboard.press("Escape");
  await expect(header).toHaveCSS("opacity", "0");
  await page.keyboard.press("Tab");
  await expect(header).toHaveCSS("opacity", "1");
});

test("backspace on an empty input returns to the previous word", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await area.click();
  await typeCurrentWord(page);
  await typeCurrentWord(page);
  await expect(page.getByText("2/10", { exact: true })).toBeVisible();

  await page.keyboard.press("Backspace");

  await expect(page.getByText("1/10", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Typing input")).not.toHaveValue("");
});
