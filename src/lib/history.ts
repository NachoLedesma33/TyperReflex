export interface HistoryEntry {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  time: number;
  mode: "time" | "words" | "zen";
  option: number;
  date: number;
}

const STORAGE_KEY = "typerreflex-history";
const MAX_ENTRIES = 200;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof e.wpm === "number" &&
        typeof e.date === "number"
    );
  } catch {
    return [];
  }
}

export function saveResult(entry: Omit<HistoryEntry, "id" | "date">): {
  entry: HistoryEntry;
  history: HistoryEntry[];
} {
  const full: HistoryEntry = {
    ...entry,
    id: makeId(),
    date: Date.now(),
  };
  const history = [full, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
  return { entry: full, history };
}

export function getPersonalBest(
  mode: HistoryEntry["mode"],
  option: number
): HistoryEntry | null {
  const matches = getHistory().filter(
    (e) => e.mode === mode && e.option === option
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, e) => (e.wpm > best.wpm ? e : best));
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export type HistoryFilter = "all" | "time" | "words" | "zen";

export function matchesHistorySearch(
  entry: HistoryEntry,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.mode.includes(q) ||
    String(entry.option).includes(q) ||
    String(entry.wpm).includes(q) ||
    String(entry.accuracy).includes(q) ||
    String(entry.rawWpm).includes(q) ||
    new Date(entry.date).toLocaleString().toLowerCase().includes(q)
  );
}

export function filterHistory(
  entries: HistoryEntry[],
  filter: HistoryFilter,
  query: string
): HistoryEntry[] {
  return entries.filter(
    (e) =>
      (filter === "all" || e.mode === filter) && matchesHistorySearch(e, query)
  );
}
