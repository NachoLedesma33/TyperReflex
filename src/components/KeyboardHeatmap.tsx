import { cn } from "@/lib/utils";

const KEY_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
] as const;

function intensityClass(count: number, max: number): string {
  if (count <= 0) return "text-typer-untyped";
  const ratio = count / max;
  if (ratio < 0.34) return "bg-primary/30 text-typer-correct";
  if (ratio < 0.67) return "bg-primary/60 text-primary-foreground";
  return "bg-primary text-primary-foreground";
}

export function KeyboardHeatmap({ data }: { data: Record<string, number> }) {
  const values = Object.values(data);
  const max = values.length > 0 ? Math.max(...values) : 0;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {KEY_ROWS.map((row, r) => (
        <div key={r} className="flex gap-1">
          {row.map((key) => {
            const count = data[key] ?? 0;
            return (
              <span
                key={key}
                title={`${key}: ${count} miss${count === 1 ? "" : "es"}`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded text-xs font-mono transition-colors",
                  intensityClass(count, max)
                )}
              >
                {key}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
