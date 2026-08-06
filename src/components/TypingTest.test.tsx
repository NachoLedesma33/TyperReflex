import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TypingTest } from "@/components/TypingTest";
import { SettingsProvider, DEFAULT_SETTINGS } from "@/lib/settings";

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
    results: { wpm: number; accuracy: number };
    onRestart: () => void;
  }) => (
    <div>
      <p>results screen</p>
      <p>wpm {results.wpm}</p>
      <p>acc {results.accuracy}%</p>
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

function renderTypingTestWithSettings(overrides: Record<string, unknown>) {
  window.localStorage.setItem(
    "typerreflex-settings",
    JSON.stringify({ ...DEFAULT_SETTINGS, ...overrides })
  );
  return renderTypingTest();
}

function setupUser() {
  return userEvent.setup();
}

function typingAreaText() {
  return screen.getByRole("textbox", { name: "Typing area" }).textContent ?? "";
}

describe("TypingTest", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("changes the duration with the number shortcuts while idle and not typing", async () => {
    const user = setupUser();
    renderTypingTest();

    // Typing always wins in the focused input, so shortcuts need focus elsewhere
    screen.getByLabelText("Typing input").blur();
    await user.keyboard("3");

    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("types a shortcut letter in the focused input without triggering the shortcut", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "words" }));
    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("m");

    expect(input).toHaveValue("m");
    expect(screen.getByRole("button", { name: "words" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("auto-focuses the typing input on load without a click", () => {
    renderTypingTest();
    expect(screen.getByLabelText("Typing input")).toHaveFocus();
  });

  it("shows the onboarding hint on the first visit and dismisses it on a keystroke", async () => {
    const user = setupUser();
    renderTypingTest();

    expect(screen.getByText("click here and start typing")).toBeInTheDocument();

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("h");

    expect(
      screen.queryByText("click here and start typing")
    ).not.toBeInTheDocument();
  });

  it("pauses with Esc and resumes without losing progress", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("h");
    expect(input).toHaveValue("h");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "resume" })).toBeInTheDocument();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("h");

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("button", { name: "resume" })
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("readonly");

    await user.keyboard("e");
    expect(input).toHaveValue("he");
  });

  it("shows a finish button while running and ends the test early", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("h");
    const finish = screen.getByRole("button", { name: "finish" });
    expect(finish).toBeInTheDocument();

    await user.click(finish);
    expect(await screen.findByText("results screen")).toBeInTheDocument();
  });

  it("does not advance past an incorrect word in strict mode", async () => {
    const user = setupUser();
    renderTypingTestWithSettings({ strictMode: true });

    await user.click(screen.getByRole("button", { name: "words" }));
    await user.click(screen.getByRole("button", { name: "10" }));

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("xx ");

    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(input).toHaveValue("xx");
    expect(document.querySelector(".typer-strict-reject")).toBeInTheDocument();

    await user.keyboard("{Backspace}{Backspace}w0 ");
    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  it("confirms a restart with Tab when enabled and there is progress", async () => {
    const user = setupUser();
    renderTypingTestWithSettings({ confirmRestart: true });
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("h");

    await user.keyboard("{Tab}");
    expect(
      screen.getByText("restart? progress will be lost")
    ).toBeInTheDocument();
    expect(input).toHaveValue("h");

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(
      screen.queryByText("restart? progress will be lost")
    ).not.toBeInTheDocument();
    expect(input).toHaveValue("h");

    await user.keyboard("{Tab}");
    await user.click(screen.getByRole("button", { name: "restart" }));
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("flashes the corrected character when backspacing over an error", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");
    input.focus();

    await user.keyboard("x");
    await user.keyboard("{Backspace}");

    expect(document.querySelector(".typer-fix-flash")).toBeInTheDocument();

    await user.keyboard("w");
    expect(document.querySelector(".typer-fix-flash")).not.toBeInTheDocument();
  });

  it("jumps back to the previous word when pressing Backspace on an empty input", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "words" }));
    await user.click(screen.getByRole("button", { name: "10" }));

    const input = screen.getByLabelText("Typing input");
    input.focus();
    await user.keyboard("w0 ");
    expect(screen.getByText("1/10")).toBeInTheDocument();
    expect(input).toHaveValue("");

    await user.keyboard("{Backspace}");
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(input).toHaveValue("w0");
  });

  it("counts a corrected error toward accuracy after going back to fix it", async () => {
    const user = setupUser();
    renderTypingTest();

    await user.click(screen.getByRole("button", { name: "words" }));
    await user.click(screen.getByRole("button", { name: "10" }));

    const input = screen.getByLabelText("Typing input");
    input.focus();
    // Complete w0 with a wrong char, then jump back and fix it.
    await user.keyboard("wX ");
    expect(input).toHaveValue("");

    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("wX");

    await user.keyboard("{Backspace}0 ");
    expect(screen.getByText("1/10")).toBeInTheDocument();

    // Correcting must not wash away the mistake from the final score:
    // 2 correct chars against 1 mistake → 67%.
    await user.click(screen.getByRole("button", { name: "finish" }));
    expect(await screen.findByText("acc 67%")).toBeInTheDocument();
  });

  it("enables focus mode while running and disables it when idle", async () => {
    const user = setupUser();
    renderTypingTest();
    const input = screen.getByLabelText("Typing input");

    expect(document.body).not.toHaveClass("typer-focus-mode");

    input.focus();
    await user.keyboard("h");
    expect(document.body).toHaveClass("typer-focus-mode");

    await user.keyboard("{Tab}");
    expect(document.body).not.toHaveClass("typer-focus-mode");
  });
});
