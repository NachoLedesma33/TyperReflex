import type { Results } from "@/components/ResultsScreen";

export type CharStatus = "untyped" | "correct" | "incorrect" | "extra";

export interface CompletedWord {
  word: string;
  typed: string;
}

export function getCharStatuses(word: string, typed: string): CharStatus[] {
  const out: CharStatus[] = [];
  for (let i = 0; i < word.length; i++) {
    if (i >= typed.length) out.push("untyped");
    else out.push(typed[i] === word[i] ? "correct" : "incorrect");
  }
  for (let i = word.length; i < typed.length; i++) out.push("extra");
  return out;
}

export function wordHasError(word: string, typed: string): boolean {
  if (typed.length !== word.length) return true;
  for (let i = 0; i < word.length; i++) {
    if (typed[i] !== word[i]) return true;
  }
  return false;
}

export function calcResults(
  completed: CompletedWord[],
  elapsedSecs: number
): Results {
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let totalTyped = 0;

  for (const { word, typed } of completed) {
    totalTyped += typed.length + 1; // +1 for space
    for (let i = 0; i < Math.max(word.length, typed.length); i++) {
      if (i < typed.length && i < word.length) {
        if (typed[i] === word[i]) correctChars++;
        else incorrectChars++;
      } else if (i >= word.length) {
        extraChars++;
      } else {
        incorrectChars++; // missed chars
      }
    }
  }

  const minutes = Math.max(elapsedSecs / 60, 0.001);
  const wpm = Math.round(correctChars / 5 / minutes);
  const rawWpm = Math.round(totalTyped / 5 / minutes);
  const totalAttempted = correctChars + incorrectChars;
  const accuracy =
    totalAttempted > 0
      ? Math.round((correctChars / totalAttempted) * 100)
      : 100;

  return {
    wpm,
    rawWpm,
    accuracy,
    correctChars,
    incorrectChars,
    extraChars,
    time: Math.round(elapsedSecs),
  };
}

export function computeLiveWpm(
  completed: CompletedWord[],
  elapsedSecs: number
): { wpm: number; rawWpm: number } {
  let correctChars = 0;
  let totalTyped = 0;

  for (const { word, typed } of completed) {
    totalTyped += typed.length + 1;
    for (let i = 0; i < Math.max(word.length, typed.length); i++) {
      if (i < typed.length && i < word.length && typed[i] === word[i]) {
        correctChars++;
      }
    }
  }

  const minutes = Math.max(elapsedSecs / 60, 0.001);
  return {
    wpm: Math.round(correctChars / 5 / minutes),
    rawWpm: Math.round(totalTyped / 5 / minutes),
  };
}
