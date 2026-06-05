import { describe, expect, it } from "vitest";
import { normalizeSearchTerm } from "./search";

describe("normalizeSearchTerm", () => {
  it("normalizes full-width input and trims repeated spaces", () => {
    expect(normalizeSearchTerm("  １３６９   菅一瑞  ")).toBe("1369 菅一瑞");
  });

  it("removes query-control characters before Supabase filters are built", () => {
    expect(normalizeSearchTerm("a,b%_*()[]{}'\"`;\\|<>/")).toBe("a b");
  });
});
