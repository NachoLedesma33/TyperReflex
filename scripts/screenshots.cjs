// Generates README screenshots into docs/screenshots/.
// Usage: node scripts/screenshots.cjs
// Starts its own `vite preview` on port 4417 and closes it at the end.

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

const SETTINGS_KEY = "typerreflex-settings";
const HISTORY_KEY = "typerreflex-history";
const STATS_KEY = "typerreflex-stats";

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

function seedLocalStorage(key, value, merge = false) {
  return (page) =>
    page.addInitScript(
      ([k, v, m]) => {
        if (m) {
          const existing = JSON.parse(localStorage.getItem(k) ?? "{}");
          localStorage.setItem(k, JSON.stringify({ ...existing, ...v }));
        } else {
          localStorage.setItem(k, JSON.stringify(v));
        }
      },
      [key, value, merge]
    );
}

function setOnboarded(page) {
  return page.addInitScript(() => {
    localStorage.setItem("typerreflex-onboarded", "1");
  });
}

async function currentWord(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".border-typer-word-border");
    return el ? (el.textContent ?? "") : "";
  });
}

async function setWordsMode(page, count) {
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: String(count), exact: true }).click();
}

async function finishShortTest(page) {
  await setWordsMode(page, 10);
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

const SEED_STATS = {
  tests: 4,
  totalTypedChars: 1020,
  totalTimeSecs: 240,
  bestWpm: 100,
  bestWpmDate: 1767000180000,
  wpmSum: 280,
  accSum: 380,
  activity: {},
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  killPort(PORT);

  console.log("[1/8] building...");
  execFileSync("npm", ["run", "build"], { stdio: "inherit", shell: true });

  const preview = spawn("npx", ["vite", "preview", "--port", String(PORT)], {
    stdio: "ignore",
    shell: true,
  });

  const browser = await chromium.launch();
  try {
    console.log("[2/8] waiting for preview...");
    await waitForServer();

    const shot = async (page, name) => {
      await page.waitForSelector(typingArea);
      await page.waitForTimeout(900); // splash
      await page.screenshot({ path: path.join(OUT_DIR, name) });
      console.log("     -", name);
    };

    const newPage = (viewport) => browser.newPage({ viewport });

    // 1. Desktop light — idle
    const desktop = await newPage({ width: 1280, height: 720 });
    await setOnboarded(desktop);
    await desktop.goto(URL);
    await shot(desktop, "desktop-light.png");
    await desktop.close();

    // 2. Desktop dark — idle
    const dark = await newPage({ width: 1280, height: 720 });
    await setOnboarded(dark);
    await seedLocalStorage("typerreflex-theme", "dark")(dark);
    await dark.goto(URL);
    await shot(dark, "desktop-dark.png");
    await dark.close();

    // 3. In-progress — focus mode while typing a words test
    const running = await newPage({ width: 1280, height: 720 });
    await setOnboarded(running);
    await running.goto(URL);
    await running.waitForSelector(typingArea);
    await running.waitForTimeout(900);
    await setWordsMode(running, 25);
    await running.getByRole("textbox", { name: "Typing area" }).click();
    for (let i = 0; i < 4; i++) {
      const word = await currentWord(running);
      if (!word) break;
      await running.keyboard.type(word + " ", { delay: 35 });
    }
    await running.waitForTimeout(600);
    await running.screenshot({ path: path.join(OUT_DIR, "running.png") });
    console.log("     - running.png");
    await running.close();

    // 4. Results — finished test with charts
    const results = await newPage({ width: 1280, height: 720 });
    await setOnboarded(results);
    await results.goto(URL);
    await results.waitForSelector(typingArea);
    await results.waitForTimeout(900);
    console.log("[3/8] running a short test for results screen...");
    await finishShortTest(results);
    await results.waitForTimeout(500); // let chart render
    await results.screenshot({ path: path.join(OUT_DIR, "results.png") });
    console.log("     - results.png");
    await results.close();

    // 5. Settings dialog — dark theme
    const settings = await newPage({ width: 1280, height: 720 });
    await setOnboarded(settings);
    await seedLocalStorage("typerreflex-theme", "dark")(settings);
    await settings.goto(URL);
    await settings.waitForSelector(typingArea);
    await settings.waitForTimeout(900);
    await settings.getByRole("button", { name: "Settings" }).click();
    await settings.getByRole("dialog").waitFor();
    await settings.waitForTimeout(700); // dialog entrance animation
    await settings.screenshot({ path: path.join(OUT_DIR, "settings.png") });
    console.log("     - settings.png");
    await settings.close();

    // 6. History dialog — seeded trend chart
    const history = await newPage({ width: 1280, height: 720 });
    await setOnboarded(history);
    await seedLocalStorage(HISTORY_KEY, TREND_ENTRIES)(history);
    await history.goto(URL);
    await history.waitForSelector(typingArea);
    await history.waitForTimeout(900);
    await history.getByRole("button", { name: "History" }).click();
    await history.getByRole("dialog").waitFor();
    await history.waitForTimeout(700);
    await history.screenshot({ path: path.join(OUT_DIR, "history.png") });
    console.log("     - history.png");
    await history.close();

    // 7. Stats dialog — seeded benchmark
    const stats = await newPage({ width: 1280, height: 720 });
    await setOnboarded(stats);
    await seedLocalStorage(HISTORY_KEY, TREND_ENTRIES)(stats);
    await seedLocalStorage(STATS_KEY, SEED_STATS)(stats);
    await stats.goto(URL);
    await stats.waitForSelector(typingArea);
    await stats.waitForTimeout(900);
    await stats.getByRole("button", { name: "Stats" }).click();
    await stats.getByRole("dialog").waitFor();
    await stats.waitForTimeout(700);
    await stats.screenshot({ path: path.join(OUT_DIR, "stats.png") });
    console.log("     - stats.png");
    await stats.close();

    // 8. Mobile — responsive idle
    const mobile = await newPage({ width: 390, height: 844 });
    await setOnboarded(mobile);
    await mobile.goto(URL);
    await shot(mobile, "mobile.png");
    await mobile.close();

    console.log("[8/8] screenshots written to", OUT_DIR);
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
