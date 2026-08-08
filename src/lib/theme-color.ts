// Dynamic PWA tab color: mirrors the resolved app background (dark/light +
// background themes and custom palettes) into <meta name="theme-color">.
// The value is read from the live `--background` custom property so CSS stays
// the single source of truth; oklch is converted to hex for browser support.

const OKLCH_RE =
  /^oklch\(\s*([\d.]+)(%)?\s+([\d.]+)(%)?\s+([\d.-]+)(?:\s*\/\s*[^)]+)?\s*\)$/i;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function oklchToHex(value: string): string | null {
  const match = OKLCH_RE.exec(value.trim());
  if (!match) {
    return null;
  }

  // Browsers serialize L as a percentage ("oklch(13% .018 16)"); spec form
  // uses 0-1. Accept both.
  const L = Number(match[1]) / (match[2] === "%" ? 100 : 1);
  const C = Number(match[3]) / (match[4] === "%" ? 100 : 1);
  const H = Number(match[5]) * (Math.PI / 180);
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  // OKLab → LMS → linear sRGB (Björn Ottosson reference matrices).
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toGamma = (c: number): number => {
    const c01 = clamp01(c);
    return c01 <= 0.0031308 ? 12.92 * c01 : 1.055 * c01 ** (1 / 2.4) - 0.055;
  };

  const toHex = (c: number): string =>
    Math.round(clamp01(toGamma(c)) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(rLin)}${toHex(gLin)}${toHex(bLin)}`;
}

export function resolveThemeColor(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const background = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  if (!background) {
    return null;
  }
  return oklchToHex(background);
}

export function syncThemeColor(): void {
  if (typeof document === "undefined") {
    return;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    return;
  }
  const color = resolveThemeColor();
  if (color) {
    meta.setAttribute("content", color);
  }
}
