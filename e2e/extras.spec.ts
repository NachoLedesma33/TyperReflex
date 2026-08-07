import { test, expect } from "@playwright/test";
import { setWordsMode, typeCurrentWord } from "./helpers";

const SETTINGS_KEY = "typerreflex-settings";
const HISTORY_KEY = "typerreflex-history";
const STATS_KEY = "typerreflex-stats";

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

function seedHistory(entries: unknown[]) {
  return (page: import("@playwright/test").Page) =>
    page.addInitScript(
      ([key, arr]) => localStorage.setItem(key, JSON.stringify(arr)),
      [HISTORY_KEY, entries] as const
    );
}

function seedStats(stats: unknown) {
  return (page: import("@playwright/test").Page) =>
    page.addInitScript(
      ([key, obj]) => localStorage.setItem(key, JSON.stringify(obj)),
      [STATS_KEY, stats] as const
    );
}

const TREND_ENTRIES = [
  {
    id: "a",
    wpm: 120,
    rawWpm: 130,
    accuracy: 98,
    correctChars: 300,
    incorrectChars: 5,
    extraChars: 0,
    time: 60,
    mode: "time",
    option: 30,
    date: 1767000000000,
  },
  {
    id: "b",
    wpm: 80,
    rawWpm: 85,
    accuracy: 94,
    correctChars: 200,
    incorrectChars: 8,
    extraChars: 1,
    time: 60,
    mode: "words",
    option: 25,
    date: 1767000600000,
  },
  {
    id: "c",
    wpm: 90,
    rawWpm: 92,
    accuracy: 97,
    correctChars: 250,
    incorrectChars: 4,
    extraChars: 0,
    time: 0,
    mode: "zen",
    option: 0,
    date: 1767001200000,
  },
];

test("custom accent applies oklch vars and persists after reload", async ({
  page,
}) => {
  // Seed only when no settings exist yet, so a reload keeps the edited value.
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(
        key,
        JSON.stringify({ customTheme: { hue: 200, lightness: 0.6 } })
      );
    }
  }, SETTINGS_KEY);
  await page.goto("/");

  const primary = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary")
    );
  await expect.poll(primary).toBe("oklch(0.6 0.2 200)");

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  const hue = dialog.getByRole("slider", { name: "Accent hue" });
  await hue.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(primary).toBe("oklch(0.6 0.2 201)");

  await page.reload();
  await expect.poll(primary).toBe("oklch(0.6 0.2 201)");
  const stored = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "{}")["customTheme"] as unknown,
    SETTINGS_KEY
  );
  expect(stored).toEqual({ hue: 201, lightness: 0.6 });
});

test("picking a preset palette clears the custom accent", async ({ page }) => {
  await seedSettings({ customTheme: { hue: 200, lightness: 0.6 } })(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Crimson" }).click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--primary")
      )
    )
    .toBe("oklch(0.52 0.22 22)");
  const stored = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "{}")["customTheme"] as unknown,
    SETTINGS_KEY
  );
  expect(stored).toBeNull();
});

test("history search filters entries and the trend hides with one result", async ({
  page,
}) => {
  await seedHistory(TREND_ENTRIES)(page);
  await page.goto("/");
  await page.getByRole("button", { name: "History" }).click();
  const dialog = page.getByRole("dialog");
  const trendSvg = dialog.locator('svg[viewBox="0 0 360 64"]');

  // Two or more filtered entries plot a trend
  await expect(dialog.getByText("wpm trend")).toBeVisible();
  await expect(trendSvg).toBeVisible();

  // Search narrows to a single entry, which stops the trend
  const search = dialog.getByLabel("Search history");
  await search.fill("zen");
  await expect(dialog.getByText("90", { exact: true })).toBeVisible();
  await expect(dialog.getByText("120", { exact: true })).not.toBeVisible();
  await expect(dialog.getByText("not enough data to plot")).toBeVisible();
  await expect(trendSvg).not.toBeVisible();

  // Clearing the query restores the trend and the full list
  await search.fill("");
  await expect(dialog.getByText("wpm trend")).toBeVisible();
  await expect(dialog.getByText("120", { exact: true })).toBeVisible();

  // The mode filters work on top of the list
  await dialog.getByRole("button", { name: "words", exact: true }).click();
  await expect(dialog.getByText("80", { exact: true })).toBeVisible();
  await expect(dialog.getByText("120", { exact: true })).not.toBeVisible();
});

test("stats dialog benchmarks wpm against your own runs", async ({ page }) => {
  const history = [40, 60, 80, 100].map((wpm, i) => ({
    id: `r${i}`,
    wpm,
    rawWpm: wpm + 5,
    accuracy: 95,
    correctChars: 250,
    incorrectChars: 5,
    extraChars: 0,
    time: 60,
    mode: "time",
    option: 30,
    date: 1767000000000 + i * 60000,
  }));
  await seedHistory(history)(page);
  await seedStats({
    tests: 4,
    totalTypedChars: 1020,
    totalTimeSecs: 240,
    bestWpm: 100,
    bestWpmDate: 1767000180000,
    wpmSum: 280,
    accSum: 380,
    activity: {},
  })(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Stats" }).click();
  const dialog = page.getByRole("dialog");

  await expect(dialog.getByText("benchmark (vs your runs)")).toBeVisible();
  await expect(dialog.getByText("mean rank")).toBeVisible();
  await expect(dialog.getByText("best rank")).toBeVisible();
  // mean wpm 70 beats 40 and 60, best wpm 100 beats everything
  await expect(dialog.getByText("better than 50%")).toBeVisible();
  await expect(dialog.getByText("better than 100%")).toBeVisible();
  await expect(dialog.getByText("0–109 wpm distribution")).toBeVisible();
});

test("results show correctly typed words vs total", async ({ page }) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await area.click();

  // One deliberately wrong word, then nine correct ones
  await page.keyboard.type("zzzz ", { delay: 10 });
  for (let i = 0; i < 9; i++) {
    await typeCurrentWord(page);
  }

  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();
  await expect(page.getByText("words 9/10", { exact: true })).toBeVisible();
});
