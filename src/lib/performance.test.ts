import { describe, expect, it } from "vitest";
import { buildResultDetailResponse } from "./performance";
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

describe("buildResultDetailResponse workout timing", () => {
  it("turns cumulative checkpoints into per-zone intervals for replay and workout summary", () => {
    const detail = buildResultDetailResponse("static", result, [
      split("跑步1", 1, 1_000),
      split("项目1", 2, 2_000),
      split("第1区", 3, 3_000),
      split("跑步2", 4, 4_000),
      split("项目2", 5, 5_000),
      split("第2区", 6, 12_000),
    ], [result]);

    expect(detail.workoutSummary.sections[0]).toMatchObject({
      totalTimeMs: 3_000,
      transitionTimeMs: 0,
    });
    expect(detail.workoutSummary.sections[1]).toMatchObject({
      totalTimeMs: 9_000,
      transitionTimeMs: 0,
    });
    expect(detail.workoutSummary.replayTotalMs).toBe(12_000);
    expect(detail.raceReplay.map((step) => step.timeMs)).toEqual([1_000, 2_000, 4_000, 5_000]);
  });

  it("keeps interval checkpoints as per-zone totals", () => {
    const detail = buildResultDetailResponse("static", result, [
      split("跑步1", 1, 1_000),
      split("项目1", 2, 2_000),
      split("第1区", 3, 3_000),
      split("跑步2", 4, 4_000),
      split("项目2", 5, 5_000),
      split("第2区", 6, 9_000),
    ], [result]);

    expect(detail.workoutSummary.sections[1]).toMatchObject({
      totalTimeMs: 9_000,
      transitionTimeMs: 0,
    });
    expect(detail.workoutSummary.replayTotalMs).toBe(12_000);
  });

  it("treats monotonic aggregate-only checkpoints as cumulative timing", () => {
    const detail = buildResultDetailResponse("static", result, [
      split("第1区", 1, 3_000),
      split("第2区", 2, 12_000),
      split("第3区", 3, 15_000),
    ], [result]);

    expect(detail.workoutSummary.sections[0]).toMatchObject({ totalTimeMs: 3_000 });
    expect(detail.workoutSummary.sections[1]).toMatchObject({ totalTimeMs: 9_000 });
    expect(detail.workoutSummary.sections[2]).toMatchObject({ totalTimeMs: 3_000 });
    expect(detail.workoutSummary.replayTotalMs).toBe(15_000);
    expect(detail.raceReplay.map((step) => step.timeMs)).toEqual([3_000, 9_000, 3_000]);
  });
});

function split(key: string, order: number, ms: number): SplitEntry {
  return {
    eventSlug: "event",
    divisionCode: "D1",
    bib: "1001",
    splitKey: key,
    splitLabel: key,
    splitOrder: order,
    splitTimeMs: ms,
    splitTimeText: "",
  };
}
