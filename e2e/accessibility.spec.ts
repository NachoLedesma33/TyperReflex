import { test, expect } from "@playwright/test";

test("typing area exposes accessible names", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Typing input")).toBeAttached();
  await expect(
    page.getByRole("textbox", { name: "Typing area" })
  ).toBeAttached();

  // Toolbar buttons are announced by role and mark their pressed state
  // (time is the default mode, so it starts pressed)
  for (const name of ["punctuation", "numbers", "capitals", "words"]) {
    const btn = page.getByRole("button", { name, exact: true });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-pressed", "false");
  }
  await expect(
    page.getByRole("button", { name: "time", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
});

test("toolbar buttons are keyboard navigable with Tab", async ({ page }) => {
  await page.goto("/");
  // The typing input auto-focuses on load; wait for that effect to settle
  // (webkit can race it and steal focus back from the button).
  await expect(page.getByLabel("Typing input")).toBeFocused();
  const first = page.getByRole("button", { name: "punctuation" });
  await first.focus();
  await expect(first).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "numbers", exact: true })
  ).toBeFocused();
});

test("countdown timer exposes a non-spamming timer role", async ({ page }) => {
  await page.goto("/");
  const area = page.getByRole("textbox", { name: "Typing area" });
  await expect(area).toBeVisible();

  await area.click();
  await page.keyboard.type("a");

  const timer = page.getByRole("timer");
  await expect(timer).toBeVisible();
  await expect(timer).toHaveAttribute("aria-label", /seconds remaining/);
});

test("settings and history controls expose accessible names", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("slider", { name: "Font size" })).toBeVisible();
  await expect(dialog.getByRole("slider", { name: "Word gap" })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Font" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "History" }).click();
  const history = page.getByRole("dialog");
  await expect(history).toBeVisible();
  await expect(
    history.getByRole("button", { name: "all", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
});

test("untyped text meets WCAG AA contrast on the default light theme", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("textbox", { name: "Typing area" })
  ).toBeVisible();
  const ratio = await page.evaluate(() => {
    const el = document.querySelector(".text-typer-untyped");
    if (!el) return 0;

    let bgEl: Element | null = el;
    while (
      bgEl &&
      getComputedStyle(bgEl).backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      bgEl = bgEl.parentElement;
    }
    const fg = getComputedStyle(el).color;
    const bg = bgEl
      ? getComputedStyle(bgEl).backgroundColor
      : getComputedStyle(document.body).backgroundColor;

    const toLinear = (c: number) =>
      c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    // Parse rgb()/rgba() or oklch()/oklab() into linear-sRGB components.
    const linearSrgb = (s: string): [number, number, number] => {
      const m = (s.match(/[\d.]+/g) ?? []).map(Number);
      if (s.startsWith("oklch") || s.startsWith("oklab")) {
        const [L, C, H] = m;
        const a = C * Math.cos((H * Math.PI) / 180);
        const b = C * Math.sin((H * Math.PI) / 180);
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.291485548 * b;
        const l = l_ ** 3;
        const mm = m_ ** 3;
        const s = s_ ** 3;
        return [
          4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
        ];
      }
      return m.slice(0, 3) as [number, number, number];
    };

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const lum = (rgb: [number, number, number]) => {
      const [r, g, b] = rgb.map((v) => toLinear(clamp01(v)));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const L1 = lum(linearSrgb(fg));
    const L2 = lum(linearSrgb(bg));
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
