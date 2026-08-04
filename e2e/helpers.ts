import type { Page } from "@playwright/test";

export const TYPING_AREA = 'role=textbox[name="Typing area"]';

export async function typeCurrentWord(page: Page): Promise<void> {
  const word = await page.evaluate(() => {
    const el = document.querySelector(".border-typer-word-border");
    return el ? (el.textContent ?? "") : null;
  });
  if (word === null || word.length === 0) {
    throw new Error("could not read the current word from the typing area");
  }
  await page.keyboard.type(word + " ", { delay: 10 });
}

export async function setWordsMode(page: Page, count = 10): Promise<void> {
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: String(count), exact: true }).click();
}
