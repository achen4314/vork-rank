import { describe, expect, it } from "vitest";
import { formatDuration, rankDeltaText, rankLabel } from "./format";

describe("formatDuration", () => {
  it("formats normal race durations", () => {
    expect(formatDuration(3_723_000)).toBe("01:02:03");
  });

  it("keeps hours above 24 instead of wrapping", () => {
    expect(formatDuration(90_061_000)).toBe("25:01:01");
  });

  it("handles missing and negative values", () => {
    expect(formatDuration(null)).toBe("-");
    expect(formatDuration(-61_000)).toBe("-00:01:01");
  });

  it("floors sub-second precision instead of rounding into the next second", () => {
    expect(formatDuration(119_999)).toBe("00:01:59");
  });
});

describe("rankLabel", () => {
  it("labels ranked and unranked states", () => {
    expect(rankLabel(3)).toBe("第 3 名");
    expect(rankLabel(null)).toBe("未排名");
  });

  it("describes raw-to-final rank movement", () => {
    expect(rankDeltaText(2, 5)).toContain("下降 3");
    expect(rankDeltaText(5, 2)).toContain("上升 3");
    expect(rankDeltaText(3, 3)).toBe("净名次同为第 3 名");
  });
});
