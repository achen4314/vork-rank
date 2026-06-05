import fs from "node:fs/promises";
import path from "node:path";
import { normalizeSearchTerm } from "@/lib/search";
import type { RankingDataset, ResultEntry } from "@/lib/types";

let cache: RankingDataset | null = null;
let cachePromise: Promise<RankingDataset> | null = null;
const dataFilePath = path.join(process.cwd(), "data", "rankings.json");

export async function getStaticDataset(): Promise<RankingDataset> {
  if (cache) return cache;
  cachePromise ??= fs.readFile(dataFilePath, "utf8").then((json) => JSON.parse(json) as RankingDataset);
  cache = await cachePromise;
  return cache;
}

export async function hasStaticDataset(): Promise<boolean> {
  try {
    await fs.access(dataFilePath);
    return true;
  } catch {
    return false;
  }
}

export async function queryStaticResults(params: {
  q?: string;
  group?: string;
  project?: string;
  division?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<{ total: number; results: ResultEntry[] }> {
  const dataset = await getStaticDataset();
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

export async function getStaticDetail(bib: string, divisionCode: string) {
  const dataset = await getStaticDataset();
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
