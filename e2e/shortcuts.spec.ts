import { test, expect } from "@playwright/test";

test("no shortcuts are configured by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/light/);

  // The typing input auto-focuses; blur so a global shortcut would see a
  // non-editable target — but none is configured, so `d`/`m` do nothing.
  await expect(page.getByLabel("Typing input")).toBeFocused();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.keyboard.press("d");
  await page.keyboard.press("m");
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.getByRole("button", { name: "time" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("a recorded shortcut fires its action and persists", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/light/);

  // Record "d" for the theme toggle from the settings dialog.
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Set shortcut toggle theme" })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Cancel recording toggle theme" })
  ).toBeVisible();
  await page.keyboard.press("d");
  await expect(dialog.getByText("D", { exact: true })).toBeVisible();

  // Close the dialog and exercise the shortcut. Focus returns to the Settings
  // trigger (a non-editable target), so the global shortcut sees it.
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.keyboard.press("d");
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Persisted settings survive a reload and the shortcut still works.
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("recording Esc cancels and Backspace clears the binding", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "typerreflex-settings",
      JSON.stringify({ shortcuts: { theme: "d" } })
    );
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");

  // Cancel the recording with Esc: the existing binding stays.
  const toggle = dialog.getByRole("button", {
    name: "Set shortcut toggle theme",
  });
  await expect(dialog.getByText("D", { exact: true })).toBeVisible();
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(dialog.getByText("D", { exact: true })).toBeVisible();

  // Clear it with Backspace: the binding disappears.
  await toggle.click();
  await page.keyboard.press("Backspace");
  await expect(toggle).toContainText("unset");

  // With no binding, `d` no longer toggles the theme.
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.keyboard.press("d");
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("shortcut letters type normally in the focused input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "typerreflex-settings",
      JSON.stringify({ shortcuts: { modeCycle: "m", numbers: "n" } })
    );
  });
  await page.goto("/");

  // Typing always wins: `m` and `n` land in the input, not on the toolbar.
  await expect(page.getByLabel("Typing input")).toBeFocused();
  await page.keyboard.type("mn", { delay: 10 });
  await expect(page.getByLabel("Typing input")).toHaveValue("mn");

  // Pausing (Esc) brings the hidden header/toolbar back so we can assert the
  // mode and toggles never changed while typing.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "resume" })).toBeVisible();
  await expect(page.getByRole("button", { name: "time" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: "numbers" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});
