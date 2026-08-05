// Generates README screenshots into docs/screenshots/.
// Usage: node scripts/screenshots.cjs
// Starts its own `vite preview` on port 4173 and closes it at the end.

const { chromium } = require("@playwright/test");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const URL = "http://localhost:4417";
const PORT = 4417;
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");
const POLL_MS = 250;
const BOOT_TIMEOUT = 60_000;

function killPort(port) {
  // Clean up any stale `vite preview`/dev server bound to the port so a
  // previously aborted run cannot poison this one.
  try {
    const { execSync } = require("node:child_process");
    execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"`,
      { stdio: "ignore" }
    );
  } catch {
    /* nothing bound */
  }
}

function waitForServer() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(URL, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > BOOT_TIMEOUT) {
            reject(new Error("preview server did not start in time"));
          } else {
            setTimeout(tick, POLL_MS);
          }
        });
    };
    tick();
  });
}

const typingArea = 'role=textbox[name="Typing area"]';

async function setOnboarded(page) {
  await page.addInitScript(() => {
    localStorage.setItem("typerreflex-onboarded", "1");
  });
}

async function currentWord(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".border-typer-word-border");
    return el ? (el.textContent ?? "") : "";
  });
}

async function finishShortTest(page) {
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  for (let i = 0; i < 20; i++) {
    const word = await currentWord(page);
    if (!word) break;
    await page.keyboard.type(word + " ", { delay: 8 });
    const detached = await page
      .waitForSelector(typingArea, { state: "detached", timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (detached) return;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  killPort(PORT);

  console.log("[1/4] building...");
  execFileSync("npm", ["run", "build"], { stdio: "inherit", shell: true });

  const preview = spawn("npx", ["vite", "preview", "--port", String(PORT)], {
    stdio: "ignore",
    shell: true,
  });

  const browser = await chromium.launch();
  try {
    console.log("[2/4] waiting for preview...");
    await waitForServer();

    const shot = async (page, name) => {
      await page.waitForSelector(typingArea);
      await page.waitForTimeout(900); // splash
      await page.screenshot({ path: path.join(OUT_DIR, name) });
      console.log("     -", name);
    };

    const desktop = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    await setOnboarded(desktop);
    await desktop.goto(URL);
    await shot(desktop, "desktop-light.png");
    await desktop.close();

    const dark = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    await dark.addInitScript(() => {
      localStorage.setItem("typerreflex-onboarded", "1");
      localStorage.setItem("typerreflex-theme", "dark");
    });
    await dark.goto(URL);
    await shot(dark, "desktop-dark.png");
    await dark.close();

    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await setOnboarded(mobile);
    await mobile.goto(URL);
    await shot(mobile, "mobile.png");
    await mobile.close();

    const results = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    await setOnboarded(results);
    await results.goto(URL);
    await results.waitForSelector(typingArea);
    await results.waitForTimeout(900);
    console.log("[3/4] running a short test for results screen...");
    await finishShortTest(results);
    await results.waitForTimeout(500); // let chart render
    await results.screenshot({ path: path.join(OUT_DIR, "results.png") });
    console.log("     - results.png");
    await results.close();

    console.log("[4/4] screenshots written to", OUT_DIR);
  } finally {
    await browser.close();
    preview.kill();
    killPort(PORT);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
