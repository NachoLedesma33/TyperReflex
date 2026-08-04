import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TypingTest } from "@/components/TypingTest";
import { SettingsProvider } from "@/lib/settings";

const generateWordsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/words", () => ({
  generateWords: generateWordsMock,
}));

vi.mock("@/lib/sound", () => ({
  playKeySound: () => {},
  playErrorSound: () => {},
}));

vi.mock("@/lib/history", () => ({
  getPersonalBest: () => null,
  saveResult: () => ({ entry: { wpm: 0 } }),
}));

vi.mock("@/lib/stats", () => ({
  recordStats: () => {},
  recordKeyHeatmap: () => {},
}));

vi.mock("@/components/ResultsScreen", () => ({
  ResultsScreen: ({
    results,
    onRestart,
  }: {
    results: { wpm: number };
    onRestart: () => void;
  }) => (
    <div>
      <p>results screen</p>
      <p>wpm {results.wpm}</p>
      <button onClick={onRestart}>restart</button>
    </div>
  ),
}));

function renderTypingTest() {
  return render(
    <SettingsProvider>
      <TypingTest />
    </SettingsProvider>
  );
}

function setupUser() {
  return userEvent.setup();
}

function typingAreaText() {
  return screen.getByRole("textbox", { name: "Typing area" }).textContent ?? "";
}

describe("TypingTest", () => {
  beforeEach(() => {
    generateWordsMock.mockImplementation((count: number) =>
      Array.from({ length: count }, (_, i) => `w${i}`)
    );
  });

  it("renders the idle time-mode test with words and toolbar", () => {
    renderTypingTest();
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "time" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "words" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "zen" })).toBeInTheDocument();
    expect(typingAreaText()).toContain("w0");
    expect(screen.getByLabelText("Typing input")).toBeInTheDocument();
  });

  it("starts running on the first keystroke and shows the caret", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("h");

    expect(input).toHaveValue("h");
    expect(screen.queryByText("30s")).not.toBeInTheDocument();
    expect(document.querySelector(".typer-caret")).toBeInTheDocument();
  });

  it("completes a word with space and advances to the next one", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "words" }));
    await user.click(screen.getByRole("button", { name: "10" }));

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("w0 ");

    expect(input).toHaveValue("");
    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  it("finishes the test in words mode after the last word", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "words" }));
    await user.click(screen.getByRole("button", { name: "10" }));

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("w0 w1 w2 w3 w4 w5 w6 w7 w8 w9 ");

    expect(await screen.findByText("results screen")).toBeInTheDocument();
  });

  it("resets the test with Tab", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("h{Tab}");

    expect(input).toHaveValue("");
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("focuses the hidden input when the typing area is clicked", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("textbox", { name: "Typing area" }));

    expect(screen.getByLabelText("Typing input")).toHaveFocus();
  });

  it("changes duration and mode from the toolbar", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "60" }));
    expect(screen.getByText("60s")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "words" }));
    expect(screen.getByText("25 words")).toBeInTheDocument();
  });

  it("changes the duration with the number shortcuts while idle", async () => {
    const user = setupUser();
    renderTypingTest();

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("3");

    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
