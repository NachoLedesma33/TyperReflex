import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsScreen } from "@/components/ResultsScreen";
import type { HistoryEntry } from "@/lib/history";

vi.mock("canvas-confetti", () => ({
  default: () => {},
}));

const baseResults = {
  wpm: 72,
  rawWpm: 80,
  accuracy: 96,
  correctChars: 300,
  incorrectChars: 12,
  extraChars: 2,
  correctWords: 24,
  totalWords: 25,
  time: 60,
};

function renderScreen(
  overrides: Partial<Parameters<typeof ResultsScreen>[0]> = {}
) {
  return render(
    <ResultsScreen
      results={baseResults}
      chartData={[]}
      mode="words"
      timeOption={60}
      wordOption={25}
      prevBest={null}
      isNewRecord={false}
      onRestart={vi.fn()}
      {...overrides}
    />
  );
}

function historyEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "1",
    wpm: 50,
    rawWpm: 55,
    accuracy: 90,
    correctChars: 100,
    incorrectChars: 0,
    extraChars: 0,
    time: 30,
    mode: "time",
    option: 60,
    date: 1,
    ...overrides,
  };
}

describe("ResultsScreen", () => {
  it("renders wpm, accuracy and secondary stats", () => {
    renderScreen();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("96%")).toBeInTheDocument();
    expect(screen.getByText("words 24/25")).toBeInTheDocument();
    expect(screen.getByText("300/12/2")).toBeInTheDocument();
    expect(screen.getByText("25 words")).toBeInTheDocument();
    expect(screen.getByText("00:01:00")).toBeInTheDocument();
    expect(screen.getByText("not enough data to plot")).toBeInTheDocument();
  });

  it("shows the new personal best badge", () => {
    renderScreen({ isNewRecord: true });
    expect(screen.getByText("new pb!")).toBeInTheDocument();
  });

  it("shows the previous best when available", () => {
    renderScreen({
      prevBest: historyEntry({ wpm: 65, accuracy: 92 }),
    });
    expect(screen.getByText(/pb 65 wpm/)).toBeInTheDocument();
  });

  it("calls onRestart when restart is clicked", async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    renderScreen({ onRestart });
    await user.click(screen.getByRole("button", { name: "restart" }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("computes the percentile from stored history", () => {
    localStorage.setItem(
      "typerreflex-history",
      JSON.stringify([
        historyEntry(),
        historyEntry({ id: "2", wpm: 80, date: 2 }),
      ])
    );
    renderScreen({ mode: "time", timeOption: 60 });
    // 72 is above the 50 wpm entry -> 1/2 = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("lists the most common error pairs", () => {
    renderScreen({ errorPairs: { "e->i": 5, "o->space": 3 } });
    expect(
      screen.getByText((_, el) => el?.textContent === "e → i × 5")
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === "o → space × 3")
    ).toBeInTheDocument();
  });
});
