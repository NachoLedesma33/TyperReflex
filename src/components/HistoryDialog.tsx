import { useState } from "react";
import { History } from "lucide-react";

import { ToolBtn } from "@/components/ToolBtn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      <ToolBtn
        size="xs"
        variant="ghost"
        title="clear history"
        className="mt-2 w-fit"
        onClick={onClear}
      >
        clear history
      </ToolBtn>
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
        <ToolBtn
          variant="outline"
          size="icon"
          title="history"
          ariaLabel="History"
        >
          <History className="size-5" />
        </ToolBtn>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">History</DialogTitle>
          <DialogDescription>Your recent results.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 mb-3">
          {FILTERS.map((f) => (
            <ToolBtn
              key={f}
              size="xs"
              variant="ghost"
              active={filter === f}
              title={`filter: ${f}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </ToolBtn>
          ))}
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <HistoryList entries={filtered} onClear={handleClear} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
