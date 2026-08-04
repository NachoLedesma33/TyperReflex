import { test, expect } from "@playwright/test";
import { setWordsMode, typeCurrentWord } from "./helpers";

test("full flow: pick words mode, type 10 words, see results and restart", async ({
  page,
}) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await setWordsMode(page, 10);
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();

  await area.click();
  for (let i = 0; i < 10; i++) {
    await typeCurrentWord(page);
  }

  // Results screen shows the action buttons and stat cards
  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();
  for (const label of ["copy", "download", "share"]) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }
  for (const label of [
    "raw",
    "chars",
    "time",
    "mode",
    "consistency",
    "percentile",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();

  // Restart returns to an idle, fresh test
  await page.getByRole("button", { name: "restart" }).click();
  await expect(page.getByText("10 words", { exact: true })).toBeVisible();
  await expect(area).toBeVisible();
  await expect(page.getByText("1/10", { exact: true })).not.toBeVisible();
});

test("word-count mode finishes and persists the result in history", async ({
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

  await expect(page.getByRole("button", { name: "restart" })).toBeVisible();

  // The finished run is recorded under the words/10 filter
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("typerreflex-history") ?? "[]")
  );
  expect(
    history.some(
      (e: { mode: string; option: number }) =>
        e.mode === "words" && e.option === 10
    )
  ).toBe(true);
});
