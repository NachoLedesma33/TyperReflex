import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  memo,
  lazy,
  Suspense,
} from "react";
import { generateWords } from "@/lib/words";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { playErrorSound, playKeySound } from "@/lib/sound";
import {
  calcResults,
  computeLiveWpm,
  getCharStatuses,
  wordHasError,
  type CharStatus,
  type CompletedWord,
} from "@/lib/typing";
import {
  Binary,
  CaseUpper,
  Hash,
  Percent,
  Quote,
  Rows3,
  Ruler,
  Timer,
  Zap,
} from "lucide-react";
import type { ChartPoint, Results } from "@/components/ResultsScreen";
import { getPersonalBest, saveResult, type HistoryEntry } from "@/lib/history";
import { recordKeyHeatmap, recordStats } from "@/lib/stats";

const ResultsScreen = lazy(() =>
  import("@/components/ResultsScreen").then((m) => ({
    default: m.ResultsScreen,
  }))
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "time" | "words" | "zen";
type GameStatus = "idle" | "running" | "finished";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_OPTIONS = [15, 30, 60, 120] as const;
const WORD_OPTIONS = [10, 25, 50, 100] as const;
const WORDS_FOR_TIME_MODE = 300;
const ZEN_WORD_POOL = 1000;
const ZEN_REFILL_AT = 20;

// ─── Word display ─────────────────────────────────────────────────────────────

type WordSpanProps = {
  word: string;
  typed: string;
  isCurrent: boolean;
  isCompleted: boolean;
  caretStyle: "bar" | "block";
  shakeEnabled: boolean;
  setRef: (el: HTMLSpanElement | null) => void;
};

function WordSpanComponent({
  word,
  typed,
  isCurrent,
  isCompleted,
  caretStyle,
  shakeEnabled,
  setRef,
}: WordSpanProps) {
  const statuses =
    isCurrent || isCompleted ? getCharStatuses(word, typed) : null;
  const caretPos = isCurrent ? typed.length : -1;
  const totalLen = isCurrent
    ? Math.max(word.length, typed.length)
    : word.length;
  const hasErrors = isCompleted && wordHasError(word, typed);

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRef = useRef<HTMLSpanElement>(null);

  // Position the floating caret over the current character (bar style)
  useLayoutEffect(() => {
    if (!isCurrent || !caretRef.current) return;
    const target = charRefs.current[caretPos];
    const prev = charRefs.current[caretPos - 1];
    const el = target ?? prev;
    if (!el) return;
    const x = el.offsetLeft + (target ? 0 : el.offsetWidth);
    caretRef.current.style.transform = `translate(${x}px, ${el.offsetTop}px)`;
    caretRef.current.style.height = `${el.offsetHeight}px`;
  }, [isCurrent, caretPos, caretStyle]);

  return (
    <span
      ref={setRef}
      className={cn(
        "relative inline-flex font-mono tracking-wide",
        isCurrent && "border-b-2 border-typer-word-border"
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
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
            className={cn(
              "relative inline-block",
              CHAR_CLASS[status],
              status === "incorrect" && shakeEnabled && "typer-shake",
              isCurrent &&
                caretStyle === "block" &&
                i === caretPos &&
                "typer-caret-block",
              isCompleted &&
                hasErrors &&
                (status === "incorrect" || status === "untyped") &&
                "border-b-2 border-typer-wrong-dim"
            )}
          >
            {char}
            {isCurrent &&
              typed.length === word.length &&
              i === word.length - 1 && (
                <span className="typer-word-marker" aria-hidden="true">
                  ▸
                </span>
              )}
          </span>
        );
      })}
      {/* Floating bar caret (block caret lives on the char itself) */}
      {isCurrent && caretStyle === "bar" && (
        <span ref={caretRef} aria-hidden="true" className="typer-caret" />
      )}
    </span>
  );
}

const WordSpan = memo(WordSpanComponent, (prev, next) => {
  return (
    prev.word === next.word &&
    prev.typed === next.typed &&
    prev.isCurrent === next.isCurrent &&
    prev.isCompleted === next.isCompleted &&
    prev.caretStyle === next.caretStyle &&
    prev.shakeEnabled === next.shakeEnabled
  );
});

// ─── Timer ring ────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, timeLeft / total));
  return (
    <div
      className="relative size-10"
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
    >
      <svg viewBox="0 0 40 40" className="size-10 -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--typer-caret)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-200 ease-linear"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tabular-nums",
          timeLeft <= 10 ? "text-typer-wrong" : "text-primary"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ─── Character-color map ──────────────────────────────────────────────────────

const CHAR_CLASS: Record<CharStatus, string> = {
  untyped: "text-typer-untyped",
  correct: "text-typer-correct",
  incorrect: "text-typer-wrong",
  extra: "text-typer-extra",
};

// ─── Toolbar button ───────────────────────────────────────────────────────────

export function ToolBtn({
  active,
  onClick,
  title,
  icon: Icon,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xl transition-colors whitespace-nowrap",
        "hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "text-primary" : "text-typer-untyped hover:text-typer-correct"
      )}
    >
      {Icon && <Icon className="size-4.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ─── Toolbar (static subtree, isolated so keystrokes don't re-render it) ─────

type OptionsToolbarProps = {
  mode: Mode;
  timeOption: number;
  wordOption: number;
  punctuation: boolean;
  numbers: boolean;
  capitals: boolean;
  longWords: boolean;
  onlyNumbers: boolean;
  onlySymbols: boolean;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  setTimeOption: React.Dispatch<React.SetStateAction<number>>;
  setWordOption: React.Dispatch<React.SetStateAction<number>>;
  setPunctuation: React.Dispatch<React.SetStateAction<boolean>>;
  setNumbers: React.Dispatch<React.SetStateAction<boolean>>;
  setCapitals: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleLong: () => void;
  onToggleNumberOnly: () => void;
  onToggleSymbolOnly: () => void;
};

const OptionsToolbar = memo(function OptionsToolbar({
  mode,
  timeOption,
  wordOption,
  punctuation,
  numbers,
  capitals,
  longWords,
  onlyNumbers,
  onlySymbols,
  setMode,
  setTimeOption,
  setWordOption,
  setPunctuation,
  setNumbers,
  setCapitals,
  onToggleLong,
  onToggleNumberOnly,
  onToggleSymbolOnly,
}: OptionsToolbarProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap items-center justify-center gap-0.5">
        <ToolBtn
          active={punctuation}
          title="punctuation (p)"
          icon={Quote}
          onClick={() => setPunctuation((p) => !p)}
        >
          punctuation
        </ToolBtn>
        <ToolBtn
          active={numbers}
          title="numbers (n)"
          icon={Hash}
          onClick={() => setNumbers((n) => !n)}
        >
          numbers
        </ToolBtn>
        <ToolBtn
          active={capitals}
          title="capitals (c)"
          icon={CaseUpper}
          onClick={() => setCapitals((c) => !c)}
        >
          capitals
        </ToolBtn>
        <ToolBtn
          active={longWords}
          title="long words (l)"
          icon={Ruler}
          onClick={onToggleLong}
        >
          long
        </ToolBtn>
        <ToolBtn
          active={onlyNumbers}
          title="only numbers"
          icon={Binary}
          onClick={onToggleNumberOnly}
        >
          number
        </ToolBtn>
        <ToolBtn
          active={onlySymbols}
          title="only symbols"
          icon={Percent}
          onClick={onToggleSymbolOnly}
        >
          symbol
        </ToolBtn>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-0.5">
        <ToolBtn
          active={mode === "time"}
          title="time mode (m)"
          icon={Timer}
          onClick={() => setMode("time")}
        >
          time
        </ToolBtn>
        <ToolBtn
          active={mode === "words"}
          title="words mode (m)"
          icon={Rows3}
          onClick={() => setMode("words")}
        >
          words
        </ToolBtn>
        <ToolBtn
          active={mode === "zen"}
          title="zen mode (m)"
          icon={Zap}
          onClick={() => setMode("zen")}
        >
          zen
        </ToolBtn>

        <span className="w-px h-4 bg-border/50 mx-2 shrink-0" />

        {mode === "time"
          ? TIME_OPTIONS.map((t, i) => (
              <ToolBtn
                key={t}
                active={timeOption === t}
                title={`${t} seconds (${i + 1})`}
                onClick={() => setTimeOption(t)}
              >
                {t}
              </ToolBtn>
            ))
          : WORD_OPTIONS.map((w, i) => (
              <ToolBtn
                key={w}
                active={wordOption === w}
                title={`${w} words (${i + 1})`}
                onClick={() => setWordOption(w)}
              >
                {w}
              </ToolBtn>
            ))}
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export function TypingTest() {
  // Options
  const [mode, setMode] = useState<Mode>("time");
  const [timeOption, setTimeOption] = useState(30);
  const [wordOption, setWordOption] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [capitals, setCapitals] = useState(false);
  const [longWords, setLongWords] = useState(false);
  const [onlyNumbers, setOnlyNumbers] = useState(false);
  const [onlySymbols, setOnlySymbols] = useState(false);

  // Game state
  const [words, setWords] = useState<string[]>([]);
  const [completedWords, setCompletedWords] = useState<CompletedWord[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(30);
  const [results, setResults] = useState<Results | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [prevBest, setPrevBest] = useState<HistoryEntry | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [keyHeatmap, setKeyHeatmap] = useState<Record<string, number>>({});
  const [errorPairs, setErrorPairs] = useState<Record<string, number>>({});
  const [liveAnnounce, setLiveAnnounce] = useState("");

  const { settings } = useSettings();
  const soundEnabledRef = useRef(settings.soundEnabled);

  // ── Live WPM recorder ─────────────────────────────────────────────────────────

  const recordWpm = useCallback((elapsedSecs: number, force = false) => {
    const secs = Math.max(0, Math.floor(elapsedSecs));
    const hist = wpmHistoryRef.current;
    const last = hist[hist.length - 1];
    if (!force && last && Math.floor(last.t) === secs) return;
    const { wpm, rawWpm } = computeLiveWpm(
      completedWordsRef.current,
      Math.max(elapsedSecs, 0.001)
    );
    hist.push({ t: secs, wpm, raw: rawWpm });
    setChartData([...hist]);
  }, []);

  // Refs (hot-path, no re-render needed)
  const inputRef = useRef<HTMLInputElement>(null);
  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const completedWordsRef = useRef<CompletedWord[]>([]);
  const currentWordIdxRef = useRef(0);
  const gameStatusRef = useRef<GameStatus>("idle");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineHeightRef = useRef(44);
  const modeRef = useRef<Mode>("time");
  const wordOptionRef = useRef(25);
  const timeOptionRef = useRef(30);
  const currentInputRef = useRef("");
  const wordsStateRef = useRef<string[]>([]);
  const durationRef = useRef(30);
  const lastTickRef = useRef(30);
  const wpmHistoryRef = useRef<ChartPoint[]>([]);
  const finishedSavedRef = useRef(false);
  const punctuationRef = useRef(false);
  const numbersRef = useRef(false);
  const capitalsRef = useRef(false);
  const longWordsRef = useRef(false);
  const onlyNumbersRef = useRef(false);
  const onlySymbolsRef = useRef(false);
  const errorPairsRef = useRef<Record<string, number>>({});
  const keyHeatmapRef = useRef<Record<string, number>>({});

  // Keep refs in sync
  useEffect(() => {
    completedWordsRef.current = completedWords;
    currentWordIdxRef.current = currentWordIdx;
    gameStatusRef.current = gameStatus;
    modeRef.current = mode;
    wordOptionRef.current = wordOption;
    timeOptionRef.current = timeOption;
    wordsStateRef.current = words;
    soundEnabledRef.current = settings.soundEnabled;
    punctuationRef.current = punctuation;
    numbersRef.current = numbers;
    capitalsRef.current = capitals;
    longWordsRef.current = longWords;
    onlyNumbersRef.current = onlyNumbers;
    onlySymbolsRef.current = onlySymbols;
  }, [
    completedWords,
    currentWordIdx,
    gameStatus,
    mode,
    wordOption,
    timeOption,
    words,
    settings.soundEnabled,
    punctuation,
    numbers,
    capitals,
    longWords,
    onlyNumbers,
    onlySymbols,
  ]);

  // ── Finish test ──────────────────────────────────────────────────────────────

  const finishTest = useCallback(
    (finalCompleted?: CompletedWord[]) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (dataTimerRef.current) {
        clearInterval(dataTimerRef.current);
        dataTimerRef.current = null;
      }
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const completed = finalCompleted ?? completedWordsRef.current;
      const res = calcResults(completed, elapsed);
      recordWpm(elapsed, true);

      const mode = modeRef.current;
      const option =
        mode === "time"
          ? timeOptionRef.current
          : mode === "words"
            ? wordOptionRef.current
            : 0;

      if (!finishedSavedRef.current) {
        finishedSavedRef.current = true;
        const prev = getPersonalBest(mode, option);
        setPrevBest(prev);
        setIsNewRecord(!prev || res.wpm > prev.wpm);
        const { entry } = saveResult({
          wpm: res.wpm,
          rawWpm: res.rawWpm,
          accuracy: res.accuracy,
          correctChars: res.correctChars,
          incorrectChars: res.incorrectChars,
          extraChars: res.extraChars,
          time: res.time,
          mode,
          option,
        });
        recordStats(entry);
        recordKeyHeatmap(keyHeatmapRef.current);
      }

      setResults(res);
      setKeyHeatmap({ ...keyHeatmapRef.current });
      setErrorPairs({ ...errorPairsRef.current });
      setGameStatus("finished");
      gameStatusRef.current = "finished";
    },
    [recordWpm]
  );

  // ── Reset test ───────────────────────────────────────────────────────────────

  const resetTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (dataTimerRef.current) {
      clearInterval(dataTimerRef.current);
      dataTimerRef.current = null;
    }
    const count =
      modeRef.current === "time"
        ? WORDS_FOR_TIME_MODE
        : modeRef.current === "zen"
          ? ZEN_WORD_POOL
          : wordOptionRef.current;
    const newWords = generateWords(count, {
      punctuation: punctuationRef.current,
      numbers: numbersRef.current,
      capitals: capitalsRef.current,
      longWords: longWordsRef.current,
      onlyNumbers: onlyNumbersRef.current,
      onlySymbols: onlySymbolsRef.current,
    });

    setWords(newWords);
    wordsStateRef.current = newWords;
    setCompletedWords([]);
    completedWordsRef.current = [];
    setCurrentInput("");
    currentInputRef.current = "";
    setCurrentWordIdx(0);
    currentWordIdxRef.current = 0;
    setGameStatus("idle");
    gameStatusRef.current = "idle";
    setTimeLeft(timeOption);
    durationRef.current = timeOption;
    lastTickRef.current = timeOption;
    setResults(null);
    setScrollOffset(0);
    setChartData([]);
    wpmHistoryRef.current = [];
    finishedSavedRef.current = false;
    setPrevBest(null);
    setIsNewRecord(false);
    setKeyHeatmap({});
    wordElsRef.current = [];
    keyHeatmapRef.current = {};
    setErrorPairs({});
    errorPairsRef.current = {};
  }, [timeOption]);

  // Focus the hidden input whenever the test is back to idle (avoids nested setTimeout)
  useEffect(() => {
    if (gameStatus === "idle") {
      inputRef.current?.focus();
    }
  }, [gameStatus]);

  // Re-initialize when any option changes
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    resetTest();
  }, [
    mode,
    timeOption,
    wordOption,
    punctuation,
    numbers,
    capitals,
    longWords,
    onlyNumbers,
    onlySymbols,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

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

  // Announce the test start (with its duration) once, via a polite live region.
  // The ticking countdown itself uses role="timer" so it is not re-announced.
  const prevStatusRef = useRef<GameStatus>("idle");
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;
    if (prev === "idle" && gameStatus === "running" && mode === "time") {
      setLiveAnnounce(`test started, ${timeOption} seconds remaining`);
    }
  }, [gameStatus, mode, timeOption]);

  // ── Input handler ────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameStatusRef.current === "finished") return;
      const value = e.target.value;
      const prevValue = currentInputRef.current;
      currentInputRef.current = value;

      if (soundEnabledRef.current && value.length !== prevValue.length) {
        playKeySound();
      }

      // Start test on first character
      if (gameStatusRef.current === "idle" && value.length > 0) {
        startTimeRef.current = performance.now();
        setGameStatus("running");
        gameStatusRef.current = "running";
        recordWpm(0);

        if (modeRef.current === "time") {
          durationRef.current = timeOptionRef.current;
          lastTickRef.current = timeOptionRef.current;
          timerRef.current = setInterval(() => {
            const elapsed = (performance.now() - startTimeRef.current) / 1000;
            const remaining = Math.max(
              0,
              Math.ceil(durationRef.current - elapsed)
            );
            if (remaining !== lastTickRef.current) {
              lastTickRef.current = remaining;
              setTimeLeft(remaining);
            }
            if (remaining <= 0) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              finishTest();
            }
          }, 200);
        }

        dataTimerRef.current = setInterval(() => {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          recordWpm(elapsed);
        }, 1000);
      }

      // Capture mistyped keys for the heatmap
      {
        const word = wordsStateRef.current[currentWordIdxRef.current] ?? "";
        for (let i = prevValue.length; i < value.length; i++) {
          const expected = word[i]?.toLowerCase();
          if (expected && value[i] !== word[i]) {
            keyHeatmapRef.current[expected] =
              (keyHeatmapRef.current[expected] ?? 0) + 1;
            const pair = `${expected}->${value[i].toLowerCase() ?? ""}`;
            errorPairsRef.current[pair] =
              (errorPairsRef.current[pair] ?? 0) + 1;
          }
        }
      }

      // Space → complete word
      if (value.endsWith(" ") && value.trim().length > 0) {
        const typed = value.trim();
        const word = wordsStateRef.current[currentWordIdxRef.current] ?? "";
        const isCorrect = typed === word;

        // Missed chars (word finished early with space)
        for (let i = typed.length; i < word.length; i++) {
          const expected = word[i]?.toLowerCase();
          if (expected) {
            keyHeatmapRef.current[expected] =
              (keyHeatmapRef.current[expected] ?? 0) + 1;
            const pair = `${expected}->space`;
            errorPairsRef.current[pair] =
              (errorPairsRef.current[pair] ?? 0) + 1;
          }
        }

        const newCompleted = [...completedWordsRef.current, { word, typed }];
        completedWordsRef.current = newCompleted;
        setCompletedWords(newCompleted);
        setCurrentInput("");
        currentInputRef.current = "";

        const nextIdx = currentWordIdxRef.current + 1;
        currentWordIdxRef.current = nextIdx;
        setCurrentWordIdx(nextIdx);

        if (!isCorrect && soundEnabledRef.current) {
          playErrorSound();
        }

        // Zen mode: top up the pool when running low
        if (
          modeRef.current === "zen" &&
          nextIdx >= wordsStateRef.current.length - ZEN_REFILL_AT
        ) {
          const more = generateWords(500, {
            punctuation: punctuationRef.current,
            numbers: numbersRef.current,
            capitals: capitalsRef.current,
            longWords: longWordsRef.current,
            onlyNumbers: onlyNumbersRef.current,
            onlySymbols: onlySymbolsRef.current,
          });
          wordsStateRef.current = [...wordsStateRef.current, ...more];
          setWords(wordsStateRef.current);
        }

        // Word-count mode: check if we're done
        if (modeRef.current === "words" && nextIdx >= wordOptionRef.current) {
          finishTest(newCompleted);
        }
      } else {
        setCurrentInput(value);
      }
    },
    [finishTest, recordWpm]
  );

  // ── Option toggles (mutually exclusive dedicated modes) ─────────────────────

  const toggleLong = useCallback(() => {
    setLongWords((v) => !v);
    setOnlyNumbers(false);
    setOnlySymbols(false);
  }, []);

  const toggleNumberOnly = useCallback(() => {
    setOnlyNumbers((v) => !v);
    setLongWords(false);
    setOnlySymbols(false);
  }, []);

  const toggleSymbolOnly = useCallback(() => {
    setOnlySymbols((v) => !v);
    setLongWords(false);
    setOnlyNumbers(false);
  }, []);

  // ── Keyboard handler ─────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key.toLowerCase();

      if (k === "tab") {
        e.preventDefault();
        resetTest();
        return;
      }

      if (k === "escape" && gameStatusRef.current === "running") {
        e.preventDefault();
        finishTest();
        return;
      }

      // Shortcuts only while idle (letters/digits must still type during a test)
      if (gameStatusRef.current !== "idle") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const digit = Number(k);
      if (k >= "1" && k <= "4" && !Number.isNaN(digit)) {
        e.preventDefault();
        const idx = digit - 1;
        if (modeRef.current === "time" && idx < TIME_OPTIONS.length) {
          setTimeOption(TIME_OPTIONS[idx]);
        } else if (modeRef.current === "words" && idx < WORD_OPTIONS.length) {
          setWordOption(WORD_OPTIONS[idx]);
        }
        return;
      }

      switch (k) {
        case "p":
          e.preventDefault();
          setPunctuation((v) => !v);
          break;
        case "n":
          e.preventDefault();
          setNumbers((v) => !v);
          break;
        case "c":
          e.preventDefault();
          setCapitals((v) => !v);
          break;
        case "l":
          e.preventDefault();
          toggleLong();
          break;
        case "m":
          e.preventDefault();
          setMode((m) =>
            m === "time" ? "words" : m === "words" ? "zen" : "time"
          );
          break;
      }
    },
    [resetTest, finishTest, toggleLong]
  );

  // ── Click / key to focus ────────────────────────────────────────────────────

  const handleAreaClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleAreaKeyDown = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ── Results screen ────────────────────────────────────────────────────────────

  if (gameStatus === "finished" && results) {
    return (
      <Suspense
        fallback={
          <div className="font-mono text-xl text-typer-untyped py-16 text-center">
            loading results…
          </div>
        }
      >
        <ResultsScreen
          results={results}
          chartData={chartData}
          mode={mode}
          timeOption={timeOption}
          wordOption={wordOption}
          prevBest={prevBest}
          isNewRecord={isNewRecord}
          keyHeatmap={keyHeatmap}
          errorPairs={errorPairs}
          onRestart={resetTest}
        />
      </Suspense>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const progressPct =
    mode === "time"
      ? Math.round(((timeOption - timeLeft) / timeOption) * 100)
      : mode === "words"
        ? Math.round((currentWordIdx / wordOption) * 100)
        : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4">
      {/* ── Toolbar ── */}
      <OptionsToolbar
        mode={mode}
        timeOption={timeOption}
        wordOption={wordOption}
        punctuation={punctuation}
        numbers={numbers}
        capitals={capitals}
        longWords={longWords}
        onlyNumbers={onlyNumbers}
        onlySymbols={onlySymbols}
        setMode={setMode}
        setTimeOption={setTimeOption}
        setWordOption={setWordOption}
        setPunctuation={setPunctuation}
        setNumbers={setNumbers}
        setCapitals={setCapitals}
        onToggleLong={toggleLong}
        onToggleNumberOnly={toggleNumberOnly}
        onToggleSymbolOnly={toggleSymbolOnly}
      />

      {/* ── Counter / timer ── */}
      <div className="h-10 flex items-center">
        <span aria-live="polite" className="sr-only">
          {liveAnnounce}
        </span>
        {gameStatus === "idle" && (
          <span className="font-mono text-2xl text-typer-untyped">
            {mode === "time"
              ? `${timeOption}s`
              : mode === "words"
                ? `${wordOption} words`
                : "zen"}
          </span>
        )}
        {gameStatus === "running" && mode === "time" && (
          <TimerRing timeLeft={timeLeft} total={timeOption} />
        )}
        {gameStatus === "running" && mode === "words" && (
          <span
            className="font-mono text-3xl font-semibold tabular-nums leading-none text-primary"
            aria-label={`${currentWordIdx} of ${wordOption} words completed`}
          >
            {currentWordIdx}/{wordOption}
          </span>
        )}
        {gameStatus === "running" && mode === "zen" && (
          <button
            onClick={() => finishTest()}
            className="font-mono text-xl text-typer-untyped hover:text-primary transition-colors"
          >
            finish
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      {mode !== "zen" && (
        <div
          className="h-0.5 w-full rounded bg-border/40 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="test progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* ── Word display ── */}
      <div
        className="relative cursor-text select-none focus-visible:outline-2 focus-visible:outline-primary"
        role="textbox"
        aria-label="Typing area"
        tabIndex={0}
        onClick={handleAreaClick}
        onKeyDown={handleAreaKeyDown}
      >
        {/* Fixed-height overflow container (3 rows) */}
        <div
          className="overflow-hidden"
          style={{ height: "calc(var(--typer-line-height) * 3)" }}
        >
          <div
            className="typer-words flex flex-wrap"
            style={{
              columnGap: "var(--typer-word-gap-x)",
              transform: `translateY(-${scrollOffset}px)`,
              transition:
                scrollOffset > 0 ? "transform 0.15s ease-out" : "none",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {words.slice(0, currentWordIdx + 80).map((word, idx) => {
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
                  caretStyle={settings.caretStyle}
                  shakeEnabled={settings.shakeEnabled}
                  setRef={(el) => {
                    wordElsRef.current[idx] = el;
                  }}
                />
              );
            })}
          </div>
        </div>
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
        tab – restart · esc – finish
      </p>
    </div>
  );
}
