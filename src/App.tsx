import { useEffect, useState } from "react";

import { TypingTest } from "@/components/TypingTest";
import { ModeToggle } from "@/components/mode-toggle";
import { SettingsDialog } from "@/components/SettingsDialog";
import { HistoryDialog } from "@/components/HistoryDialog";
import { StatsDialog } from "@/components/StatsDialog";
import { getStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

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
        <p className="font-mono text-4xl font-bold text-primary tracking-tight select-none">
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
    <footer className="px-8 py-6 shrink-0 flex items-center justify-center gap-6 flex-wrap">
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

      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between shrink-0">
        <span className="font-mono text-2xl font-bold text-primary tracking-tight select-none">
          TyperReflex
        </span>
        <div className="flex items-center gap-2">
          <HistoryDialog />
          <StatsDialog />
          <SettingsDialog />
          <ModeToggle />
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
