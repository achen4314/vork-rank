import type { ResultEntry } from "@/lib/types";

export const statusFilterOptions = [
  { value: "", label: "全部" },
  { value: "ranked", label: "已排名" },
  { value: "unranked", label: "未排名" },
  { value: "penalty", label: "有罚时" },
  { value: "dnf", label: "DNF" },
  { value: "dns", label: "DNS" },
  { value: "dsq", label: "DSQ" },
] as const;

export type StatusFilter = (typeof statusFilterOptions)[number]["value"];

const concreteStatuses = new Set(["DNF", "DNS", "DSQ"]);
const statusFilterValues = new Set(statusFilterOptions.map((option) => option.value));

export function normalizeStatusFilter(value: string | null | undefined): StatusFilter | null {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  return statusFilterValues.has(normalized as StatusFilter) ? (normalized as StatusFilter) : null;
}

export function statusFilterToDbStatus(value: string): "DNF" | "DNS" | "DSQ" | null {
  const normalized = normalizeStatusFilter(value);
  if (normalized === "dnf" || normalized === "dns" || normalized === "dsq") {
    return normalized.toUpperCase() as "DNF" | "DNS" | "DSQ";
  }
  return null;
}

export function matchesStatusFilter(entry: ResultEntry, value: string): boolean {
  const normalized = normalizeStatusFilter(value);
  if (!normalized) return true;
  if (normalized === "ranked") return entry.finalRank !== null;
  if (normalized === "unranked") return entry.finalRank === null;
  if (normalized === "penalty") return entry.appliedPenaltyMs > 0;
  return entry.status.toUpperCase() === normalized.toUpperCase();
}

export function statusLabel(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (concreteStatuses.has(normalized)) return normalized;
  if (normalized === "FINISHED") return "完赛";
  return status || "未知";
}
