import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { generateWords } from "@/lib/words";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "time" | "words";
type GameStatus = "idle" | "running" | "finished";
type CharStatus = "untyped" | "correct" | "incorrect" | "extra";

interface CompletedWord {
  word: string;
  typed: string;
}

interface Results {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  time: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_OPTIONS = [15, 30, 60, 120] as const;
const WORD_OPTIONS = [10, 25, 50, 100] as const;
const WORDS_FOR_TIME_MODE = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCharStatuses(word: string, typed: string): CharStatus[] {
  const out: CharStatus[] = [];
  for (let i = 0; i < word.length; i++) {
    if (i >= typed.length) out.push("untyped");
    else out.push(typed[i] === word[i] ? "correct" : "incorrect");
  }
  for (let i = word.length; i < typed.length; i++) out.push("extra");
  return out;
}

function wordHasError(word: string, typed: string): boolean {
  if (typed.length !== word.length) return true;
  for (let i = 0; i < word.length; i++) {
    if (typed[i] !== word[i]) return true;
  }
  return false;
}

function calcResults(completed: CompletedWord[], elapsedSecs: number): Results {
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
    totalAttempted > 0 ? Math.round((correctChars / totalAttempted) * 100) : 100;

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

// ─── Caret ────────────────────────────────────────────────────────────────────

function Caret() {
  return <span className="typer-caret" aria-hidden="true" />;
}

// ─── Character-color map ──────────────────────────────────────────────────────

const CHAR_CLASS: Record<CharStatus, string> = {
  untyped: "text-typer-untyped",
  correct: "text-typer-correct",
  incorrect: "text-typer-wrong",
  extra: "text-typer-extra",
};

// ─── Word display ─────────────────────────────────────────────────────────────

function WordSpan({
  word,
  typed,
  isCurrent,
  isCompleted,
  setRef,
}: {
  word: string;
  typed: string;
  isCurrent: boolean;
  isCompleted: boolean;
  setRef?: (el: HTMLSpanElement | null) => void;
}) {
  const statuses =
    isCurrent || isCompleted ? getCharStatuses(word, typed) : null;
  const caretPos = isCurrent ? typed.length : -1;
  const totalLen = isCurrent
    ? Math.max(word.length, typed.length)
    : word.length;
  const hasErrors = isCompleted && wordHasError(word, typed);

  return (
    <span
      ref={setRef}
      className={cn(
        "inline-flex font-mono tracking-wide",
        isCurrent && "border-b-2 border-typer-word-border",
        isCompleted &&
          hasErrors &&
          "border-b-2 border-typer-wrong-dim"
      )}
      style={{
        fontSize: "var(--typer-font-size)",
        lineHeight: "var(--typer-line-height)",
      }}
    >
      {Array.from({ length: totalLen }, (_, i) => {
        const status: CharStatus = statuses?.[i] ?? "untyped";
        const char =
          i < word.length ? word[i] : i < typed.length ? typed[i] : "";

        return (
          <span key={i} className={cn("relative inline-block", CHAR_CLASS[status])}>
            {isCurrent && i === caretPos && <Caret />}
            {char}
          </span>
        );
      })}
      {/* Caret at the very end (all chars processed) */}
      {isCurrent && caretPos >= totalLen && <Caret />}
    </span>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  mode,
  timeOption,
  wordOption,
  onRestart,
}: {
  results: Results;
  mode: Mode;
  timeOption: number;
  wordOption: number;
  onRestart: () => void;
}) {
  const modeLabel =
    mode === "time" ? `${timeOption}s` : `${wordOption} words`;

  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto px-4 py-8">
      {/* Primary stats */}
      <div className="flex items-end gap-10">
        <div>
          <p className="font-mono text-xs text-typer-untyped mb-1">wpm</p>
          <p className="font-mono text-9xl font-bold leading-none text-typer-correct tabular-nums">
            {results.wpm}
          </p>
        </div>
        <div className="pb-2">
          <p className="font-mono text-xs text-typer-untyped mb-1">acc</p>
          <p className="font-mono text-5xl font-semibold leading-none text-typer-correct tabular-nums">
            {results.accuracy}%
          </p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="flex items-start gap-10 flex-wrap">
        {[
          { label: "raw", value: String(results.rawWpm) },
          {
            label: "chars",
            value: `${results.correctChars}/${results.incorrectChars}/${results.extraChars}`,
          },
          { label: "time", value: `${results.time}s` },
          { label: "mode", value: modeLabel },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="font-mono text-xs text-typer-untyped mb-0.5">
              {label}
            </p>
            <p className="font-mono text-xl font-semibold text-typer-untyped tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="group flex items-center gap-2 font-mono text-sm text-typer-untyped hover:text-primary transition-colors w-fit"
        title="Restart (tab)"
      >
        <RotateCcw className="size-4 transition-transform duration-300 group-hover:rotate-[-180deg]" />
        restart
      </button>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded font-mono text-sm transition-colors",
        active
          ? "text-primary"
          : "text-typer-untyped hover:text-typer-correct"
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TypingTest() {
  // Options
  const [mode, setMode] = useState<Mode>("time");
  const [timeOption, setTimeOption] = useState(30);
  const [wordOption, setWordOption] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);

  // Game state
  const [words, setWords] = useState<string[]>([]);
  const [completedWords, setCompletedWords] = useState<CompletedWord[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(30);
  const [results, setResults] = useState<Results | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Refs (hot-path, no re-render needed)
  const inputRef = useRef<HTMLInputElement>(null);
  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const completedWordsRef = useRef<CompletedWord[]>([]);
  const currentWordIdxRef = useRef(0);
  const gameStatusRef = useRef<GameStatus>("idle");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineHeightRef = useRef(44);
  const modeRef = useRef<Mode>("time");
  const wordOptionRef = useRef(25);
  const wordsStateRef = useRef<string[]>([]);

  // Keep refs in sync
  completedWordsRef.current = completedWords;
  currentWordIdxRef.current = currentWordIdx;
  gameStatusRef.current = gameStatus;
  modeRef.current = mode;
  wordOptionRef.current = wordOption;
  wordsStateRef.current = words;

  // ── Finish test ──────────────────────────────────────────────────────────────

  const finishTest = useCallback(
    (finalCompleted?: CompletedWord[]) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const completed = finalCompleted ?? completedWordsRef.current;
      const res = calcResults(completed, elapsed);
      setResults(res);
      setGameStatus("finished");
      gameStatusRef.current = "finished";
    },
    []
  );

  // ── Reset test ───────────────────────────────────────────────────────────────

  const resetTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const count =
      modeRef.current === "time" ? WORDS_FOR_TIME_MODE : wordOptionRef.current;
    const newWords = generateWords(count, punctuation, numbers);

    setWords(newWords);
    wordsStateRef.current = newWords;
    setCompletedWords([]);
    completedWordsRef.current = [];
    setCurrentInput("");
    setCurrentWordIdx(0);
    currentWordIdxRef.current = 0;
    setGameStatus("idle");
    gameStatusRef.current = "idle";
    setTimeLeft(timeOption);
    setResults(null);
    setScrollOffset(0);
    wordElsRef.current = [];

    setTimeout(() => inputRef.current?.focus(), 50);
  }, [punctuation, numbers, timeOption]);

  // Re-initialize when any option changes
  useEffect(() => {
    resetTest();
  }, [mode, timeOption, wordOption, punctuation, numbers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute line height after words render ────────────────────────────────────

  useLayoutEffect(() => {
    const el = wordElsRef.current[0];
    if (el) lineHeightRef.current = el.offsetHeight || 44;
  }, [words]);

  // ── Scroll management ────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === "finished") return;
    const wordEl = wordElsRef.current[currentWordIdx];
    if (!wordEl) return;

    const lh = lineHeightRef.current;
    const row = Math.round(wordEl.offsetTop / lh);

    if (row >= 2) {
      setScrollOffset((row - 1) * lh);
    } else if (row === 0) {
      setScrollOffset(0);
    }
  }, [currentWordIdx, gameStatus]);

  // ── Watch timeLeft hitting 0 ─────────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "running") {
      finishTest();
    }
  }, [timeLeft, gameStatus, finishTest]);

  // ── Input handler ────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameStatusRef.current === "finished") return;
      const value = e.target.value;

      // Start test on first character
      if (gameStatusRef.current === "idle" && value.length > 0) {
        startTimeRef.current = Date.now();
        setGameStatus("running");
        gameStatusRef.current = "running";

        if (modeRef.current === "time") {
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) return 0;
              return prev - 1;
            });
          }, 1000);
        }
      }

      // Space → complete word
      if (value.endsWith(" ") && value.trim().length > 0) {
        const typed = value.trim();
        const word = wordsStateRef.current[currentWordIdxRef.current] ?? "";

        const newCompleted = [
          ...completedWordsRef.current,
          { word, typed },
        ];
        completedWordsRef.current = newCompleted;
        setCompletedWords(newCompleted);
        setCurrentInput("");

        const nextIdx = currentWordIdxRef.current + 1;
        currentWordIdxRef.current = nextIdx;
        setCurrentWordIdx(nextIdx);

        // Word-count mode: check if we're done
        if (
          modeRef.current === "words" &&
          nextIdx >= wordOptionRef.current
        ) {
          finishTest(newCompleted);
        }
      } else {
        setCurrentInput(value);
      }
    },
    [finishTest]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        resetTest();
      }
    },
    [resetTest]
  );

  // ── Click to focus ───────────────────────────────────────────────────────────

  const handleAreaClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ── Results screen ────────────────────────────────────────────────────────────

  if (gameStatus === "finished" && results) {
    return (
      <ResultsScreen
        results={results}
        mode={mode}
        timeOption={timeOption}
        wordOption={wordOption}
        onRestart={resetTest}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center flex-wrap gap-0.5">
        <ToolBtn active={punctuation} onClick={() => setPunctuation((p) => !p)}>
          @ punctuation
        </ToolBtn>
        <ToolBtn active={numbers} onClick={() => setNumbers((n) => !n)}>
          # numbers
        </ToolBtn>

        <span className="w-px h-4 bg-border/50 mx-2 shrink-0" />

        <ToolBtn active={mode === "time"} onClick={() => setMode("time")}>
          time
        </ToolBtn>
        <ToolBtn active={mode === "words"} onClick={() => setMode("words")}>
          words
        </ToolBtn>

        <span className="w-px h-4 bg-border/50 mx-2 shrink-0" />

        {mode === "time"
          ? TIME_OPTIONS.map((t) => (
              <ToolBtn
                key={t}
                active={timeOption === t}
                onClick={() => setTimeOption(t)}
              >
                {t}
              </ToolBtn>
            ))
          : WORD_OPTIONS.map((w) => (
              <ToolBtn
                key={w}
                active={wordOption === w}
                onClick={() => setWordOption(w)}
              >
                {w}
              </ToolBtn>
            ))}
      </div>

      {/* ── Counter / timer ── */}
      <div className="h-10 flex items-center">
        {gameStatus === "idle" && (
          <span className="font-mono text-sm text-typer-untyped">
            {mode === "time" ? `${timeOption}s` : `${wordOption} words`}
          </span>
        )}
        {gameStatus === "running" && (
          <span
            className={cn(
              "font-mono text-3xl font-semibold tabular-nums leading-none",
              mode === "time" && timeLeft <= 10
                ? "text-typer-wrong"
                : "text-primary"
            )}
          >
            {mode === "time"
              ? timeLeft
              : `${currentWordIdx}/${wordOption}`}
          </span>
        )}
      </div>

      {/* ── Word display ── */}
      <div
        className="relative cursor-text select-none"
        onClick={handleAreaClick}
      >
        {/* Fixed-height overflow container (3 rows) */}
        <div
          className="overflow-hidden"
          style={{ height: "calc(var(--typer-line-height) * 3)" }}
        >
          <div
            className="flex flex-wrap"
            style={{
              columnGap: "var(--typer-word-gap-x)",
              transform: `translateY(-${scrollOffset}px)`,
              transition:
                scrollOffset > 0 ? "transform 0.15s ease-out" : "none",
            }}
          >
            {words.map((word, idx) => {
              const isCompleted = idx < currentWordIdx;
              const isCurrent = idx === currentWordIdx;
              const typed = isCompleted
                ? (completedWords[idx]?.typed ?? "")
                : isCurrent
                ? currentInput
                : "";

              return (
                <WordSpan
                  key={`${idx}-${word}`}
                  word={word}
                  typed={typed}
                  isCurrent={isCurrent}
                  isCompleted={isCompleted}
                  setRef={(el) => {
                    wordElsRef.current[idx] = el;
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Fade gradient – top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10" />
        {/* Fade gradient – bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      {/* Hidden input (captures all keystrokes) */}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={-1}
        aria-label="Typing input"
      />

      {/* Restart hint */}
      <p className="text-center font-mono text-xs text-typer-untyped opacity-55">
        tab – restart
      </p>
    </div>
  );
}
