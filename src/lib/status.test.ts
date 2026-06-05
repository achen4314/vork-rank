import { describe, expect, it } from "vitest";
import { matchesStatusFilter, normalizeStatusFilter, statusFilterToDbStatus, statusLabel } from "./status";
import type { ResultEntry } from "./types";

const baseEntry: ResultEntry = {
  eventSlug: "event",
  divisionCode: "A",
  divisionName: "A组",
  groupName: "公开组",
  projectName: "男子单人",
  bib: "1369",
  displayName: "测试选手",
  teamName: "",
  school: "",
  gender: "男",
  rawRank: null,
  finalRank: null,
  status: "DNF",
  netTimeMs: null,
  cumulativePenaltyMs: 0,
  appliedPenaltyMs: 0,
  finalTimeMs: null,
  netTimeText: "",
  cumulativePenaltyText: "",
  appliedPenaltyText: "",
  finalTimeText: "",
  penaltyStatus: "",
  note: "",
  sourceRow: 1,
};

describe("status filters", () => {
  it("accepts all supported URL filter values", () => {
    expect(normalizeStatusFilter(" DNF ")).toBe("dnf");
    expect(normalizeStatusFilter("dsq")).toBe("dsq");
    expect(normalizeStatusFilter("bad")).toBeNull();
  });

  it("maps concrete filters to database status values", () => {
    expect(statusFilterToDbStatus("dns")).toBe("DNS");
    expect(statusFilterToDbStatus("ranked")).toBeNull();
  });

  it("matches ranked, unranked, penalty, and concrete states", () => {
    expect(matchesStatusFilter(baseEntry, "unranked")).toBe(true);
    expect(matchesStatusFilter(baseEntry, "dnf")).toBe(true);
    expect(matchesStatusFilter(baseEntry, "ranked")).toBe(false);
    expect(matchesStatusFilter({ ...baseEntry, finalRank: 1, appliedPenaltyMs: 30_000, status: "FINISHED" }, "penalty")).toBe(true);
  });

  it("renders operator-facing status labels", () => {
    expect(statusLabel("FINISHED")).toBe("完赛");
    expect(statusLabel("DSQ")).toBe("DSQ");
  });
});
