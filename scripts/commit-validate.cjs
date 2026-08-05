#!/usr/bin/env node
// Validates a commit message against Conventional Commits.
// Zero-dependency so npm audit stays clean.
// Usage: node scripts/commit-validate.cjs <commit-message-file>

const fs = require("node:fs");
const path = require("node:path");

const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];
const SUBJECT_MAX = 72;

const help = `\nCommit message must follow Conventional Commits:\n\n  <type>(<scope>): <subject>\n\n  <body>\n\nAllowed types: ${TYPES.join(", ")}\nExamples:\n  feat(ux): add strict mode\n  fix: prevent shortcut stealing first keystroke\n  docs: mark section 7 (UX flow) done\n  refactor(typing)!: change generateWords signature\n\nSubject: lowercase, imperative, <= ${SUBJECT_MAX} chars.\n`;

function fail(msg) {
  process.stderr.write(`\n[commit-validate] ${msg}\n${help}`);
  process.exit(1);
}

const msgFile = process.argv[2];
if (!msgFile) fail("missing commit message file argument");

let raw = fs.readFileSync(msgFile, "utf8");

// Strip comments that git leaves in the template (e.g. "# Please enter the commit message").
raw = raw
  .split("\n")
  .filter((line) => !line.startsWith("#"))
  .join("\n")
  .trim();

if (!raw) fail("empty commit message (abort the commit or write a subject).");

// Skip merges, reverts of merges and fixup/squash autos.
if (/^(Merge|Revert "Merge|fixup!|squash!)/.test(raw)) process.exit(0);

const [first, ...rest] = raw.split("\n");
const header = first.trim();

if (!header) fail("subject is empty.");

const match = /^([a-z]+)(?:\(([\w-]+)\))?(!)?: (.+)$/.exec(header);
if (!match) fail("invalid subject format.");

const [, type, scope, bang, subject] = match;

if (!TYPES.includes(type)) {
  fail(`unknown type "${type}". Allowed: ${TYPES.join(", ")}.`);
}

if (subject.length > SUBJECT_MAX) {
  fail(`subject too long (${subject.length} chars, max ${SUBJECT_MAX}).`);
}

if (bang) {
  if (!rest.some((l) => /^BREAKING CHANGE:/.test(l.trim()))) {
    fail(
      'breaking change ("!") requires a "BREAKING CHANGE:" line in the body.'
    );
  }
}

const body = rest.map((l) => l.trim()).filter(Boolean);
if (body.length && !body[0])
  fail("blank line required between subject and body.");

process.exit(0);
