import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { StartwaveEntry, StartwaveResponse } from "./types";

type StaticStartwaveDataset = {
  event: {
    slug: string;
    name: string;
    date: string;
    venue: string;
  };
  athletes: StaticStartwaveAthlete[];
};

type StaticStartwaveAthlete = {
  id: number;
  name: string;
  credentialHashes: string[];
  entries: StartwaveEntry[];
};

let cache: Promise<StaticStartwaveDataset | null> | null = null;

export async function queryStaticStartwave(
  eventSlug: string,
  name: string,
  suffix: string | undefined,
): Promise<StartwaveResponse | null> {
  const dataset = await readStaticStartwave();
  if (!dataset || dataset.event.slug !== eventSlug) return null;

  const normalizedName = normalizeName(name);
  const sameName = dataset.athletes.filter((athlete) => normalizeName(athlete.name) === normalizedName);
  const athletes = suffix
    ? sameName.filter((athlete) => athlete.credentialHashes.includes(hashStartwaveCredential(eventSlug, athlete.name, suffix)))
    : sameName;

  if (!athletes.length) {
    return {
      success: false,
      message: `未找到 "${name}" 的报名记录，请检查姓名是否正确`,
    };
  }

  if (athletes.length > 1) {
    return {
      success: false,
      multiple: true,
      message: suffix ? `找到 ${athletes.length} 位匹配选手，请联系现场工作人员确认报名信息` : `存在 ${athletes.length} 位同名选手，请输入手机号或证件号后四位区分`,
      candidates: athletes.map((athlete) => ({
        name: athlete.name,
        projects: uniqueProjects(athlete.entries),
      })),
    };
  }

  const athlete = athletes[0];
  return {
    success: true,
    event: dataset.event,
    athlete: {
      name: athlete.name,
      phoneMasked: null,
    },
    entries: [...athlete.entries].sort(compareEntries),
  };
}

export function normalizeStartwaveSuffix(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim().toUpperCase();
  if (!text) return undefined;
  return /^[0-9A-Z]{4}$/.test(text) ? text : null;
}

function readStaticStartwave(): Promise<StaticStartwaveDataset | null> {
  cache ??= fs
    .readFile(path.join(process.cwd(), "data", "startwave.json"), "utf8")
    .then((content) => JSON.parse(content) as StaticStartwaveDataset)
    .catch(() => null);
  return cache;
}

function hashStartwaveCredential(eventSlug: string, name: string, suffix: string): string {
  return createHash("sha256").update(`${eventSlug}::${normalizeName(name)}::${suffix}`).digest("hex");
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function compareEntries(a: StartwaveEntry, b: StartwaveEntry): number {
  const time = a.startDatetime.localeCompare(b.startDatetime);
  if (time !== 0) return time;
  const project = a.projectName.localeCompare(b.projectName, "zh-Hans-CN");
  if (project !== 0) return project;
  return a.bibOrChip.localeCompare(b.bibOrChip, "zh-Hans-CN");
}

function uniqueProjects(entries: StartwaveEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.projectName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}
