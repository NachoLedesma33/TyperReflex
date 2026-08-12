import { describe, expect, it } from "vitest";

import { formatTime } from "./time";

describe("formatTime", () => {
  it("formats seconds under a minute", () => {
    expect(formatTime(42)).toBe("00:00:42");
  });

  it("rolls seconds into minutes", () => {
    expect(formatTime(60)).toBe("00:01:00");
    expect(formatTime(90)).toBe("00:01:30");
    expect(formatTime(599)).toBe("00:09:59");
  });

  it("formats the user-reported 102s run", () => {
    expect(formatTime(102)).toBe("00:01:42");
  });

  it("rolls minutes into hours", () => {
    expect(formatTime(3600)).toBe("01:00:00");
    expect(formatTime(3661)).toBe("01:01:01");
    expect(formatTime(3599)).toBe("00:59:59");
  });

  it("handles zero", () => {
    expect(formatTime(0)).toBe("00:00:00");
  });

  it("treats negatives as zero instead of printing a sign", () => {
    expect(formatTime(-5)).toBe("00:00:00");
  });

  it("rounds toward the nearest second", () => {
    expect(formatTime(42.4)).toBe("00:00:42");
    expect(formatTime(42.6)).toBe("00:00:43");
  });
});
