import { useState } from "react";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { clearHistory, getHistory, type HistoryEntry } from "@/lib/history";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function HistoryList({
  entries,
  onClear,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="font-mono text-sm text-typer-untyped py-6 text-center">
        no results yet – finish a test to see it here
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-4 rounded-lg border border-border/60 px-3 py-2"
        >
          <span className="font-mono text-2xl font-semibold text-typer-correct tabular-nums w-20">
            {e.wpm}
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-sm text-typer-untyped">
              {e.mode === "zen" ? "zen" : `${e.mode} ${e.option}`} ·{" "}
              {e.accuracy}% · raw {e.rawWpm}
            </span>
            <span className="font-mono text-xs text-typer-untyped opacity-70">
              {formatDate(e.date)}
            </span>
          </div>
        </div>
      ))}
      <button
        onClick={onClear}
        className="mt-2 font-mono text-sm text-typer-untyped hover:text-primary transition-colors w-fit"
      >
        clear history
      </button>
    </div>
  );
}

const FILTERS = ["all", "time", "words", "zen"] as const;
type Filter = (typeof FILTERS)[number];

export function HistoryDialog() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setEntries(getHistory());
  };

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.mode === filter);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="History">
          <History className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">History</DialogTitle>
          <DialogDescription>Your recent results.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 mb-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "px-2.5 py-1 rounded font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                filter === f
                  ? "bg-primary/10 text-primary"
                  : "text-typer-untyped hover:text-typer-correct"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <HistoryList entries={filtered} onClear={handleClear} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
