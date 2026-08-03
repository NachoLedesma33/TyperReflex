import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { dayKey } from "@/lib/stats";

const WEEKS = 24;

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function cellClass(count: number): string {
  if (count === 0) return "bg-border/40";
  if (count === 1) return "bg-primary/30";
  if (count === 2) return "bg-primary/60";
  return "bg-primary";
}

interface ActivityCalendarProps {
  activity: Record<string, number>;
}

export function ActivityCalendar({ activity }: ActivityCalendarProps) {
  const weeks = useMemo(() => {
    const start = addDays(new Date(), -(WEEKS * 7 - 1));
    const days: { key: string; count: number }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = addDays(start, i);
      days.push({ key: dayKey(d), count: activity[dayKey(d)] ?? 0 });
    }
    const cols: { key: string; count: number }[][] = [];
    for (let w = 0; w < WEEKS; w++) cols.push(days.slice(w * 7, w * 7 + 7));
    return cols;
  }, [activity]);

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {week.map(({ key, count }) => (
            <span
              key={key}
              title={`${key}: ${count} test${count === 1 ? "" : "s"}`}
              className={cn("h-2.5 w-2.5 rounded-[2px]", cellClass(count))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
