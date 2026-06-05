import { describe, expect, it } from "vitest";
import { buildChartAnalytics } from "./chartData";
import type { ResultEntry, SplitEntry } from "./types";

const result: ResultEntry = {
  eventSlug: "event",
  divisionCode: "D1",
  divisionName: "D1",
  groupName: "高校组",
  projectName: "男子单人",
  bib: "1001",
  displayName: "测试选手",
  teamName: "",
  school: "",
  gender: "男",
  rawRank: 1,
  finalRank: 1,
  status: "FINISHED",
  netTimeMs: 12_000,
  cumulativePenaltyMs: 0,
  appliedPenaltyMs: 0,
  finalTimeMs: 12_000,
  netTimeText: "",
  cumulativePenaltyText: "",
  appliedPenaltyText: "",
  finalTimeText: "",
  penaltyStatus: "",
  note: "",
  sourceRow: 1,
};

describe("buildChartAnalytics", () => {
  it("keeps a fixed chart shape and calculates station percentiles", () => {
    const athlete = [
      split("1001", "项目1", 2, 2_000),
      split("1001", "项目2", 5, 5_000),
      split("1002", "项目1", 2, 3_000),
      split("1002", "项目2", 5, 4_000),
    ];

    const analytics = buildChartAnalytics(result, athlete.filter((item) => item.bib === "1001"), athlete);

    expect(analytics.stationRadar).toHaveLength(6);
    expect(analytics.segmentBars).toHaveLength(12);
    expect(analytics.stationRadar[0].athletePercentile).toBe(75);
    expect(analytics.stationRadar[1].athletePercentile).toBe(25);
  });

  it("supports interval aggregate zones from the current workbook", () => {
    const splits = [
      split("1001", "跑步1", 1, 1_000),
      split("1001", "项目1", 2, 2_000),
      split("1001", "第1区", 3, 3_000),
      split("1001", "跑步2", 4, 4_000),
      split("1001", "项目2", 5, 5_000),
      split("1001", "第2区", 6, 9_000),
    ];

    const trend = buildChartAnalytics(result, splits, splits).cumulativeTrend;

    expect(trend[0].athleteMs).toBe(3_000);
    expect(trend[1].athleteMs).toBe(12_000);
  });

  it("also supports truly cumulative checkpoint zones", () => {
    const splits = [
      split("1001", "跑步1", 1, 1_000),
      split("1001", "项目1", 2, 2_000),
      split("1001", "第1区", 3, 3_000),
      split("1001", "跑步2", 4, 4_000),
      split("1001", "项目2", 5, 5_000),
      split("1001", "第2区", 6, 12_000),
    ];

    const trend = buildChartAnalytics(result, splits, splits).cumulativeTrend;

    expect(trend[0].athleteMs).toBe(3_000);
    expect(trend[1].athleteMs).toBe(12_000);
  });
});

function split(bib: string, key: string, order: number, ms: number): SplitEntry {
  return {
    eventSlug: "event",
    divisionCode: "D1",
    bib,
    splitKey: key,
    splitLabel: key,
    splitOrder: order,
    splitTimeMs: ms,
    splitTimeText: "",
  };
}
