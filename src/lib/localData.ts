import fs from "node:fs";
import path from "node:path";
import { normalizeSearchTerm } from "@/lib/search";
import type { RankingDataset, ResultEntry } from "@/lib/types";

let cache: RankingDataset | null = null;

export function getStaticDataset(): RankingDataset {
  if (!cache) {
    const filePath = path.join(process.cwd(), "data", "rankings.json");
    cache = JSON.parse(fs.readFileSync(filePath, "utf8")) as RankingDataset;
  }
  return cache;
}

export function hasStaticDataset(): boolean {
  return fs.existsSync(path.join(process.cwd(), "data", "rankings.json"));
}

export function queryStaticResults(params: {
  q?: string;
  group?: string;
  project?: string;
  division?: string;
  status?: string;
  page: number;
  pageSize: number;
}): { total: number; results: ResultEntry[] } {
  const dataset = getStaticDataset();
  const rawQ = (params.q ?? "").trim();
  const q = normalizeSearchTerm(rawQ);
  const rows = dataset.results.filter((entry) => {
    if (params.group && entry.groupName !== params.group) return false;
    if (params.project && entry.projectName !== params.project) return false;
    if (params.division && entry.divisionCode !== params.division) return false;
    if (params.status === "ranked" && entry.finalRank === null) return false;
    if (params.status === "penalty" && entry.appliedPenaltyMs <= 0) return false;
    if (!q) return !rawQ;
    return [entry.bib, entry.displayName, entry.school, entry.teamName, entry.divisionName]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
  const start = (params.page - 1) * params.pageSize;
  return { total: rows.length, results: rows.slice(start, start + params.pageSize) };
}

export function getStaticDetail(bib: string, divisionCode: string) {
  const dataset = getStaticDataset();
  const result =
    dataset.results.find(
      (entry) => entry.bib === bib && (!divisionCode || entry.divisionCode === divisionCode),
    ) ?? null;
  const splits = result
    ? dataset.splits.filter(
        (split) => split.bib === result.bib && split.divisionCode === result.divisionCode,
      )
    : [];
  const divisionSplits = result ? dataset.splits.filter((split) => split.divisionCode === result.divisionCode) : [];
  return { result, splits, divisionSplits };
}
