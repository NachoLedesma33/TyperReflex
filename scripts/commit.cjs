#!/usr/bin/env node
// Interactive Conventional Commits helper.
// Usage: node scripts/commit.cjs  (or: npm run commit)
// Stages nothing: commits whatever is already staged.

const { execFileSync } = require("node:child_process");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

const TYPES = [
  ["feat", "new feature"],
  ["fix", "bug fix"],
  ["docs", "docs only"],
  ["style", "formatting, no logic change"],
  ["refactor", "code change without behavior change"],
  ["perf", "performance improvement"],
  ["test", "tests only"],
  ["build", "build system / deps"],
  ["ci", "CI config / scripts"],
  ["chore", "maintenance"],
  ["revert", "revert a previous commit"],
];

const SUBJECT_MAX = 72;

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("\nTypes:");
  TYPES.forEach(([t, d], i) => console.log(`  ${i + 1}. ${t.padEnd(8)} ${d}`));

  const typeChoice = (await rl.question("\nType (number or name): "))
    .trim()
    .toLowerCase();
  const type = /^\d+$/.test(typeChoice)
    ? TYPES[Number(typeChoice) - 1]?.[0]
    : typeChoice;
  if (!type || !TYPES.some(([t]) => t === type)) {
    console.error(`Unknown type "${typeChoice}". Aborting.`);
    rl.close();
    process.exit(1);
  }

  const scope = (await rl.question("Scope (optional, e.g. ux): ")).trim();
  const subject = (
    await rl.question(`Subject (imperative, <= ${SUBJECT_MAX} chars): `)
  ).trim();
  if (!subject) {
    console.error("Subject is required. Aborting.");
    rl.close();
    process.exit(1);
  }
  if (subject.length > SUBJECT_MAX) {
    console.error(`Subject too long (${subject.length} chars). Aborting.`);
    rl.close();
    process.exit(1);
  }

  const breaking =
    (await rl.question("Breaking change? (y/N): ")).trim().toLowerCase() ===
    "y";

  const bodyLines = [];
  console.log("\nBody (empty line to finish):");
  while (true) {
    const line = (await rl.question("  ")).trim();
    if (!line) break;
    bodyLines.push(line);
  }
  if (breaking) bodyLines.push("BREAKING CHANGE: describe the breaking change");
  rl.close();

  const scopePart = scope ? `(${scope})` : "";
  const bang = breaking ? "!" : "";
  const subjectLine = `${type}${scopePart}${bang}: ${subject}`;

  const args = ["commit", "-m", subjectLine];
  for (const line of bodyLines) args.push("-m", line);

  console.log(`\n> git ${args.join(" ")}\n`);
  try {
    execFileSync("git", args, { stdio: "inherit" });
  } catch {
    process.exit(1);
  }
}

main();
