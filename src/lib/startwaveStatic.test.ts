import { describe, expect, it } from "vitest";
import { normalizeStartwaveSuffix, queryStaticStartwave } from "./startwaveStatic";

const eventSlug = "capital-college-fitness-2026";

describe("static startwave lookup", () => {
  it("finds a unique athlete by name", async () => {
    const response = await queryStaticStartwave(eventSlug, "宋弘策", undefined);

    expect(response?.success).toBe(true);
    if (response?.success) {
      expect(response.entries[0]).toMatchObject({
        projectName: "男子单人",
        waveLabel: "第5波",
        startTime: "10:45",
        bibOrChip: "1361",
      });
    }
  });

  it("uses credential suffix hashes for suffix validation", async () => {
    expect(await queryStaticStartwave(eventSlug, "宋弘策", "0000")).toMatchObject({
      success: false,
    });
    expect(await queryStaticStartwave(eventSlug, "宋弘策", "0631")).toMatchObject({
      success: true,
    });
  });

  it("accepts certificate suffixes that end with X", () => {
    expect(normalizeStartwaveSuffix("481x")).toBe("481X");
    expect(normalizeStartwaveSuffix("12")).toBeNull();
  });
});
