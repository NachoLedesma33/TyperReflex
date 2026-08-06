import { describe, expect, it, vi } from "vitest";
import type { SVGProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolBtn } from "@/components/ToolBtn";

describe("ToolBtn", () => {
  it("renders children and tooltip title", () => {
    render(
      <ToolBtn title="punctuation (p)" onClick={() => {}}>
        punctuation
      </ToolBtn>
    );
    expect(
      screen.getByRole("button", { name: "punctuation" })
    ).toBeInTheDocument();
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

  it("renders the icon with aria-hidden", () => {
    const Icon = (props: SVGProps<SVGSVGElement>) => (
      <svg data-testid="icon" {...props} />
    );
    render(
      <ToolBtn icon={Icon} onClick={() => {}}>
        zen
      </ToolBtn>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("disables the button and blocks clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ToolBtn disabled onClick={onClick}>
        finish
      </ToolBtn>
    );
    const btn = screen.getByRole("button", { name: "finish" });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the pill shape and variant classes", () => {
    const { container } = render(
      <ToolBtn variant="outline" size="xs" active onClick={() => {}}>
        all
      </ToolBtn>
    );
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("rounded-full");
    expect(btn).toHaveClass("border-primary/50");
    expect(btn).toHaveClass("bg-primary/10");
  });

  it("renders without a native title when a tooltip is configured", () => {
    render(
      <ToolBtn title="restart" onClick={() => {}}>
        restart
      </ToolBtn>
    );
    expect(screen.getByRole("button", { name: "restart" })).not.toHaveAttribute(
      "title"
    );
  });
});
