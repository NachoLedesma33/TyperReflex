import { lazy, Suspense, useEffect, useState } from "react";

import { ShortcutManager } from "@/components/ShortcutManager";
import { TypingTest } from "@/components/TypingTest";
import { getStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

// Header widgets are lazy-loaded: they are the only consumers of radix-ui, so
// this keeps radix out of the main chunk until a dialog/menu is first opened.
const ModeToggle = lazy(() =>
  import("@/components/mode-toggle").then((m) => ({ default: m.ModeToggle }))
);
const SettingsDialog = lazy(() =>
  import("@/components/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  }))
);
const HistoryDialog = lazy(() =>
  import("@/components/HistoryDialog").then((m) => ({
    default: m.HistoryDialog,
  }))
);
const StatsDialog = lazy(() =>
  import("@/components/StatsDialog").then((m) => ({ default: m.StatsDialog }))
);

function Splash({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background pointer-events-none",
        visible ? "typer-splash-in" : "typer-splash-out"
      )}
    >
      <div className="text-center">
        <p className="font-ui text-4xl font-bold text-primary tracking-tight select-none">
          TyperReflex
        </p>
        <p className="font-mono text-sm text-typer-untyped mt-2 select-none">
          click and start typing
        </p>
      </div>
    </div>
  );
}

function Footer() {
  const [stats, setStats] = useState(getStats);

  useEffect(() => {
    const onUpdate = () => setStats(getStats());
    window.addEventListener("typerreflex-stats-updated", onUpdate);
    return () =>
      window.removeEventListener("typerreflex-stats-updated", onUpdate);
  }, []);

  const avgWpm = stats.tests > 0 ? Math.round(stats.wpmSum / stats.tests) : 0;
  const totalHours = Math.round(stats.totalTimeSecs / 360) / 10;

  return (
    <footer className="w-full max-w-4xl mx-auto px-4 py-6 shrink-0 flex items-center justify-center gap-6 flex-wrap">
      <span className="font-mono text-xs text-typer-untyped tabular-nums">
        {stats.tests} tests
      </span>
      <span className="font-mono text-xs text-typer-untyped tabular-nums">
        avg {avgWpm} wpm
      </span>
      <span className="font-mono text-xs text-typer-untyped tabular-nums">
        best {stats.bestWpm} wpm
      </span>
      <span className="font-mono text-xs text-typer-untyped tabular-nums">
        {totalHours}h typed
      </span>
      <span className="font-mono text-xs text-typer-untyped opacity-50">·</span>
      <a
        href="https://github.com/NachoLedesma33/TyperReflex"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-typer-untyped hover:text-primary transition-colors"
      >
        github
      </a>
    </footer>
  );
}

function App() {
  const [splashVisible, setSplashVisible] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Splash visible={splashVisible} />
      <ShortcutManager />

      {/* Header – full-width so title/menu hug their side margins */}
      <header className="relative z-10 w-full px-6 md:px-10 py-5 flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          title="restart"
          onClick={() => window.dispatchEvent(new Event("typerreflex-restart"))}
          className="font-ui text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight select-none cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary transition-opacity hover:opacity-90"
        >
          TyperReflex
        </button>
        <div className="flex items-center gap-2">
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <span
                    key={i}
                    className="size-9 rounded-full border border-border/60"
                  />
                ))}
              </div>
            }
          >
            <HistoryDialog />
            <StatsDialog />
            <SettingsDialog />
            <ModeToggle />
          </Suspense>
        </div>
      </header>

      {/* Main – vertically centered, nudged slightly above center */}
      <main className="flex-1 flex items-center justify-center px-4 -mt-12">
        <TypingTest />
      </main>

      <Footer />
    </div>
  );
}

export default App;
