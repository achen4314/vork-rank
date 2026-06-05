import fs from "node:fs/promises";
import path from "node:path";
import { normalizeSearchTerm } from "@/lib/search";
import { matchesStatusFilter } from "@/lib/status";
import type { RankingDataset, ResultEntry, SplitEntry } from "@/lib/types";

type StaticStore = {
  dataset: RankingDataset;
  resultByKey: Map<string, ResultEntry>;
  resultByBib: Map<string, ResultEntry[]>;
  splitsByResult: Map<string, SplitEntry[]>;
  splitsByDivision: Map<string, SplitEntry[]>;
};

let cache: StaticStore | null = null;
let cachePromise: Promise<StaticStore> | null = null;
const dataFilePath = path.join(process.cwd(), "data", "rankings.json");

export async function getStaticDataset(): Promise<RankingDataset> {
  return (await getStaticStore()).dataset;
}

async function getStaticStore(): Promise<StaticStore> {
  if (cache) return cache;
  cachePromise ??= fs
    .readFile(dataFilePath, "utf8")
    .then((json) => buildStaticStore(JSON.parse(json) as RankingDataset))
    .catch((error: Error) => {
      cachePromise = null;
      throw new Error(`Unable to load bundled ranking data: ${error.message}`);
    });
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
  const { dataset } = await getStaticStore();
  const rawQ = (params.q ?? "").trim();
  const q = normalizeSearchTerm(rawQ);
  const rows = dataset.results.filter((entry) => {
    if (params.group && entry.groupName !== params.group) return false;
    if (params.project && entry.projectName !== params.project) return false;
    if (params.division && entry.divisionCode !== params.division) return false;
    if (!matchesStatusFilter(entry, params.status ?? "")) return false;
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
  const store = await getStaticStore();
  const trimmedDivisionCode = divisionCode.trim();
  const result = trimmedDivisionCode
    ? store.resultByKey.get(resultKey(trimmedDivisionCode, bib)) ?? null
    : uniqueResultByBib(store.resultByBib.get(bib) ?? []);
  const splits = result ? store.splitsByResult.get(resultKey(result.divisionCode, result.bib)) ?? [] : [];
  const divisionSplits = result ? store.splitsByDivision.get(result.divisionCode) ?? [] : [];
  return { result, splits, divisionSplits };
}

function buildStaticStore(dataset: RankingDataset): StaticStore {
  const resultByKey = new Map<string, ResultEntry>();
  const resultByBib = new Map<string, ResultEntry[]>();
  const splitsByResult = new Map<string, SplitEntry[]>();
  const splitsByDivision = new Map<string, SplitEntry[]>();

  dataset.results.forEach((entry) => {
    resultByKey.set(resultKey(entry.divisionCode, entry.bib), entry);
    const entriesForBib = resultByBib.get(entry.bib) ?? [];
    entriesForBib.push(entry);
    resultByBib.set(entry.bib, entriesForBib);
  });

  dataset.splits.forEach((split) => {
    const key = resultKey(split.divisionCode, split.bib);
    const splitsForResult = splitsByResult.get(key) ?? [];
    splitsForResult.push(split);
    splitsByResult.set(key, splitsForResult);

    const splitsForDivision = splitsByDivision.get(split.divisionCode) ?? [];
    splitsForDivision.push(split);
    splitsByDivision.set(split.divisionCode, splitsForDivision);
  });

  for (const splits of splitsByResult.values()) {
    splits.sort((a, b) => a.splitOrder - b.splitOrder);
  }
  for (const splits of splitsByDivision.values()) {
    splits.sort((a, b) => a.bib.localeCompare(b.bib, "zh-Hans-CN") || a.splitOrder - b.splitOrder);
  }

  return { dataset, resultByKey, resultByBib, splitsByResult, splitsByDivision };
}

function resultKey(divisionCode: string, bib: string): string {
  return `${divisionCode}\u0000${bib}`;
}

function uniqueResultByBib(entries: ResultEntry[]): ResultEntry | null {
  return entries.length === 1 ? entries[0] : null;
}
