import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, Copy, Download, RotateCcw, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/history";
import { getHistory } from "@/lib/history";
import { KeyboardHeatmap } from "@/components/KeyboardHeatmap";

export interface Results {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  time: number;
}

export interface ChartPoint {
  t: number;
  wpm: number;
  raw: number;
}

interface ResultsScreenProps {
  results: Results;
  chartData: ChartPoint[];
  mode: "time" | "words" | "zen";
  timeOption: number;
  wordOption: number;
  prevBest: HistoryEntry | null;
  isNewRecord: boolean;
  keyHeatmap?: Record<string, number>;
  errorPairs?: Record<string, number>;
  onRestart: () => void;
}

function Chart({ data }: { data: ChartPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="font-mono text-sm text-typer-untyped py-6 text-center">
        not enough data to plot
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            stroke="var(--typer-untyped)"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            fontSize={12}
            tickMargin={6}
          />
          <YAxis
            stroke="var(--typer-untyped)"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="raw"
            name="raw"
            stroke="var(--typer-untyped)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            name="wpm"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function resultSummary(
  res: Results,
  modeLabel: string,
  consistency: number | null,
  percentile: number | null
): string {
  return [
    "TyperReflex",
    `wpm: ${res.wpm} | acc: ${res.accuracy}% | raw: ${res.rawWpm}`,
    `chars: ${res.correctChars}/${res.incorrectChars}/${res.extraChars} | time: ${res.time}s`,
    `mode: ${modeLabel}`,
    `consistency: ${consistency ?? "--"} | percentile: ${percentile ?? "--"}`,
  ].join("\n");
}

export function ResultsScreen({
  results,
  chartData,
  mode,
  timeOption,
  wordOption,
  prevBest,
  isNewRecord,
  keyHeatmap,
  errorPairs,
  onRestart,
}: ResultsScreenProps) {
  const modeLabel =
    mode === "time"
      ? `${timeOption}s`
      : mode === "words"
        ? `${wordOption} words`
        : "zen";
  const [copied, setCopied] = useState(false);

  const wpmValues = useMemo(() => chartData.map((d) => d.wpm), [chartData]);
  const consistency =
    wpmValues.length >= 2
      ? Math.max(0, Math.min(100, Math.round(100 - stdDev(wpmValues))))
      : null;

  const option =
    mode === "time" ? timeOption : mode === "words" ? wordOption : 0;

  const history = useMemo(
    () => getHistory().filter((e) => e.mode === mode && e.option === option),
    [mode, option]
  );
  const percentile =
    history.length === 0
      ? null
      : Math.round(
          (history.filter((e) => e.wpm <= results.wpm).length /
            history.length) *
            100
        );

  const topErrors = useMemo(() => {
    if (!errorPairs) return [];
    return Object.entries(errorPairs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [errorPairs]);

  const summary = useMemo(
    () => resultSummary(results, modeLabel, consistency, percentile),
    [results, modeLabel, consistency, percentile]
  );

  useEffect(() => {
    if (!isNewRecord) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: 110,
      spread: 75,
      ticks: 150,
      gravity: 0.9,
      startVelocity: 38,
      origin: { x: 0.5, y: 0.3 },
      zIndex: 999,
    });
  }, [isNewRecord]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `typerreflex-${modeLabel.replace(" ", "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = summary;
    if (navigator.share) {
      try {
        await navigator.share({ title: "TyperReflex result", text });
        return;
      } catch {
        // share cancelled or unavailable – fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4 py-8">
      <p className="sr-only" role="status">
        test finished — wpm {results.wpm}, accuracy {results.accuracy}%
        {isNewRecord ? ", new personal best" : ""}
      </p>
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
        <div className="pb-2 ml-auto flex flex-col items-end gap-1">
          {isNewRecord && (
            <span className="font-mono text-sm font-semibold text-primary">
              new pb!
            </span>
          )}
          {prevBest && (
            <span className="font-mono text-sm text-typer-untyped tabular-nums">
              pb {prevBest.wpm} wpm · {prevBest.accuracy}%
            </span>
          )}
        </div>
      </div>

      <Chart data={chartData} />

      {keyHeatmap && Object.keys(keyHeatmap).length > 0 && (
        <div className="flex flex-col gap-3 items-center">
          <p className="font-mono text-xs text-typer-untyped self-start">
            mistyped keys
          </p>
          <KeyboardHeatmap data={keyHeatmap} />
        </div>
      )}

      <div className="flex items-start gap-10 flex-wrap">
        {[
          { label: "raw", value: String(results.rawWpm) },
          {
            label: "chars",
            value: `${results.correctChars}/${results.incorrectChars}/${results.extraChars}`,
          },
          { label: "time", value: `${results.time}s` },
          { label: "mode", value: modeLabel },
          { label: "consistency", value: consistency ?? "--" },
          {
            label: "percentile",
            value: percentile !== null ? `${percentile}%` : "--",
          },
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

      {topErrors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-typer-untyped">top errors</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {topErrors.map(([pair, count]) => {
              const [expected, typed] = pair.split("->");
              return (
                <span
                  key={pair}
                  className="font-mono text-sm text-typer-untyped tabular-nums"
                >
                  <span className="text-typer-correct">{expected}</span>
                  {" → "}
                  <span className="text-typer-wrong">
                    {typed === "space" ? "space" : typed}
                  </span>
                  <span className="opacity-50"> × {count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onRestart}
          className="group flex items-center gap-2 font-mono text-sm text-typer-untyped hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-fit"
          title="Restart (tab)"
        >
          <RotateCcw className="size-4 transition-transform duration-300 group-hover:rotate-[-180deg]" />
          restart
        </button>

        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-fit",
            copied ? "text-primary" : "text-typer-untyped hover:text-primary"
          )}
          title="Copy results"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "copied" : "copy"}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 font-mono text-sm text-typer-untyped hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-fit"
          title="Download results"
        >
          <Download className="size-4" />
          download
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 font-mono text-sm text-typer-untyped hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-fit"
          title="Share results"
        >
          <Share2 className="size-4" />
          share
        </button>
      </div>
    </div>
  );
}
