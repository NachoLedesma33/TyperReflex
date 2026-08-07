import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  easeOutCubic,
  prefersReducedMotion,
  useCountUp,
} from "@/lib/useCountUp";

describe("easeOutCubic", () => {
  it("maps the endpoints exactly", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("eases out: fast start, slow finish", () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(0.9)).toBeLessThan(1);
  });
});

describe("prefersReducedMotion", () => {
  it("is true in the test environment", () => {
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("useCountUp", () => {
  it("returns the target immediately when reduced motion is active", () => {
    const { result } = renderHook(() => useCountUp(72));
    expect(result.current).toBe(72);
  });

  it("snaps to the new target when it changes", () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target),
      { initialProps: { target: 72 } }
    );
    expect(result.current).toBe(72);
    rerender({ target: 96 });
    expect(result.current).toBe(96);
  });
});
