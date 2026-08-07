import { useState } from "react";
import { BarChart3 } from "lucide-react";

import { ToolBtn } from "@/components/ToolBtn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { KeyboardHeatmap } from "@/components/KeyboardHeatmap";
import { getHistory, type HistoryEntry } from "@/lib/history";
import {
  computeStreak,
  getKeyHeatmap,
  getStats,
  wpmDistribution,
  wpmPercentile,
  type GlobalStats,
} from "@/lib/stats";

function formatDuration(totalSecs: number): string {
  if (totalSecs >= 3600) {
    return `${Math.floor(totalSecs / 3600)}h ${Math.round((totalSecs % 3600) / 60)}m`;
  }
  if (totalSecs >= 60) {
    return `${Math.floor(totalSecs / 60)}m ${Math.round(totalSecs % 60)}s`;
  }
  return `${Math.round(totalSecs)}s`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border/60 px-3 py-2">
      <span className="font-mono text-xs text-typer-untyped">{label}</span>
      <span className="font-mono text-xl font-semibold text-typer-correct tabular-nums">
        {value}
      </span>
    </div>
  );
}

function Benchmark({
  history,
  meanWpm,
  bestWpm,
}: {
  history: HistoryEntry[];
  meanWpm: number;
  bestWpm: number;
}) {
  if (history.length === 0) return null;
  const meanRank = wpmPercentile(history, meanWpm);
  const bestRank = wpmPercentile(history, bestWpm);
  const dist = wpmDistribution(history);
  const maxCount = Math.max(...dist.map((b) => b.count), 1);
  const meanBucket = dist.findIndex(
    (b) => meanWpm >= b.min && meanWpm < b.min + 10
  );
  const highest = dist[dist.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs text-typer-untyped">
        benchmark (vs your runs)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="mean rank" value={`better than ${meanRank}%`} />
        <StatTile label="best rank" value={`better than ${bestRank}%`} />
      </div>
      <div className="flex items-end gap-1 h-20">
        {dist.map((b, i) => (
          <div key={b.min} className="flex-1 flex flex-col justify-end">
            <div
              title={`${b.min}-${b.min + 9}: ${b.count}`}
              className={[
                "w-full rounded-sm",
                i === meanBucket
                  ? "bg-primary shadow-[0_0_8px_-2px] shadow-primary/60"
                  : "bg-typer-untyped/30",
              ].join(" ")}
              style={{
                height: `${Math.max((b.count / maxCount) * 100, 4)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <p className="font-mono text-[11px] text-typer-untyped opacity-70">
        {dist[0].min}–{highest.min + 9} wpm distribution
      </p>
    </div>
  );
}

export function StatsDialog() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<GlobalStats>(() => getStats());
  const [heatmap, setHeatmap] = useState<Record<string, number>>(() =>
    getKeyHeatmap()
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setStats(getStats());
      setHeatmap(getKeyHeatmap());
      setHistory(getHistory());
    }
  };

  const meanWpm = stats.tests > 0 ? Math.round(stats.wpmSum / stats.tests) : 0;
  const meanAcc = stats.tests > 0 ? Math.round(stats.accSum / stats.tests) : 0;
  const streak = computeStreak(stats.activity);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ToolBtn variant="outline" size="icon" title="stats" ariaLabel="Stats">
          <BarChart3 className="size-5" />
        </ToolBtn>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-ui text-xl">Stats</DialogTitle>
          <DialogDescription>
            Your lifetime typing statistics.
          </DialogDescription>
        </DialogHeader>

        {stats.tests === 0 ? (
          <p className="font-mono text-sm text-typer-untyped py-6 text-center">
            no data yet – finish a test to see stats
          </p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="tests" value={String(stats.tests)} />
              <StatTile
                label="best wpm"
                value={`${stats.bestWpm}${
                  stats.bestWpmDate
                    ? ` · ${new Date(stats.bestWpmDate).toLocaleDateString()}`
                    : ""
                }`}
              />
              <StatTile label="mean wpm" value={String(meanWpm)} />
              <StatTile label="mean acc" value={`${meanAcc}%`} />
              <StatTile
                label="chars typed"
                value={stats.totalTypedChars.toLocaleString()}
              />
              <StatTile
                label="time typed"
                value={formatDuration(stats.totalTimeSecs)}
              />
              <StatTile label="current streak" value={String(streak.current)} />
              <StatTile label="longest streak" value={String(streak.longest)} />
            </div>

            <Benchmark
              history={history}
              meanWpm={meanWpm}
              bestWpm={stats.bestWpm}
            />

            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-typer-untyped">
                last 24 weeks
              </p>
              <ActivityCalendar activity={stats.activity} />
            </div>

            <div className="flex flex-col gap-3 items-center">
              <p className="font-mono text-xs text-typer-untyped self-start">
                mistyped keys (all time)
              </p>
              <KeyboardHeatmap data={heatmap} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
