import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolBtn } from "@/components/TypingTest";

describe("ToolBtn", () => {
  it("renders children and title", () => {
    render(
      <ToolBtn title="punctuation (p)" onClick={() => {}}>
        punctuation
      </ToolBtn>
    );
    expect(screen.getByRole("button", { name: "punctuation" })).toHaveAttribute(
      "title",
      "punctuation (p)"
    );
  });

  it("is marked pressed when active", () => {
    const { rerender } = render(
      <ToolBtn active onClick={() => {}}>
        words
      </ToolBtn>
    );
    expect(screen.getByRole("button", { name: "words" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    rerender(
      <ToolBtn active={false} onClick={() => {}}>
        words
      </ToolBtn>
    );
    expect(screen.getByRole("button", { name: "words" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToolBtn onClick={onClick}>time</ToolBtn>);
    await user.click(screen.getByRole("button", { name: "time" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
