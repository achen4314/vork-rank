import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSearchTerm } from "@/lib/search";
import type { EventInfo, RankingFilters, RankingSummary, ResultEntry, SplitEntry } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const eventSlug = "capital-college-fitness-2026";
const filtersCacheMs = 60_000;

let cachedClient: SupabaseClient | null | undefined;
let cachedFilters:
  | {
      expiresAt: number;
      value: { summary: RankingSummary; filters: RankingFilters };
    }
  | null = null;

type EventRow = {
  slug: string;
  name: string;
  event_date: string | null;
  venue: string | null;
  timezone: string | null;
  source_updated_at: string | null;
};

type ResultRow = {
  event_slug: string;
  division_code: string;
  division_name: string | null;
  group_name: string | null;
  project_name: string | null;
  bib: string | null;
  display_name: string | null;
  team_name: string | null;
  school: string | null;
  gender: string | null;
  raw_rank: number | null;
  final_rank: number | null;
  status: string | null;
  net_time_ms: number | null;
  cumulative_penalty_ms: number | null;
  applied_penalty_ms: number | null;
  final_time_ms: number | null;
  net_time_text: string | null;
  cumulative_penalty_text: string | null;
  applied_penalty_text: string | null;
  final_time_text: string | null;
  penalty_status: string | null;
  note: string | null;
  source_row: number | null;
};

type SplitRow = {
  event_slug: string;
  division_code: string;
  bib: string;
  split_key: string;
  split_label: string;
  split_order: number;
  split_time_ms: number | null;
  split_time_text: string | null;
};

type FilterOptionRow = Pick<ResultRow, "group_name" | "project_name" | "division_code" | "division_name">;

export function hasSupabaseConfig(): boolean {
  return Boolean(url && anon);
}

function client(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  cachedClient = url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;
  return cachedClient;
}

export async function fetchSupabaseEvent(): Promise<EventInfo | null> {
  const db = client();
  if (!db) return null;
  const { data, error } = await db.from("events").select("*").eq("slug", eventSlug).maybeSingle<EventRow>();
  if (error || !data) return null;
  return {
    slug: data.slug,
    name: data.name,
    eventDate: data.event_date ?? "",
    venue: data.venue ?? "",
    timezone: data.timezone ?? "Asia/Shanghai",
    sourceUpdatedAt: data.source_updated_at ?? "",
  };
}

export async function fetchSupabaseFilters(): Promise<{ summary: RankingSummary; filters: RankingFilters } | null> {
  const db = client();
  if (!db) return null;
  if (cachedFilters && cachedFilters.expiresAt > Date.now()) return cachedFilters.value;

  const [total, ranked, appliedPenalty, cumulativePenalty, optionRows] = await Promise.all([
    countResultRows(db, "total"),
    countResultRows(db, "ranked"),
    countResultRows(db, "appliedPenalty"),
    countResultRows(db, "cumulativePenalty"),
    db
      .from("result_entries")
      .select("group_name,project_name,division_code,division_name")
      .eq("event_slug", eventSlug)
      .returns<FilterOptionRow[]>(),
  ]);
  if (
    total === null ||
    ranked === null ||
    appliedPenalty === null ||
    cumulativePenalty === null ||
    optionRows.error ||
    !optionRows.data
  ) {
    return null;
  }

  const divisions = Array.from(
    new Map(optionRows.data.map((row) => [row.division_code, { code: row.division_code, name: row.division_name ?? "" }])).values(),
  );
  const value = {
    summary: {
      total,
      ranked,
      unranked: Math.max(0, total - ranked),
      divisionCount: divisions.length,
      appliedPenaltyCount: appliedPenalty,
      cumulativePenaltyCount: cumulativePenalty,
      sourceUpdatedAt: new Date().toISOString(),
    },
    filters: {
      groups: [...new Set(optionRows.data.map((row) => row.group_name).filter(isNonEmptyString))].sort(),
      projects: [...new Set(optionRows.data.map((row) => row.project_name).filter(isNonEmptyString))].sort(),
      divisions,
    },
  };
  cachedFilters = { expiresAt: Date.now() + filtersCacheMs, value };
  return value;
}

export async function querySupabaseResults(params: {
  q?: string;
  group?: string;
  project?: string;
  division?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<{ total: number; results: ResultEntry[] } | null> {
  const db = client();
  if (!db) return null;
  let query = db.from("result_entries").select("*", { count: "exact" }).eq("event_slug", eventSlug);
  if (params.group) query = query.eq("group_name", params.group);
  if (params.project) query = query.eq("project_name", params.project);
  if (params.division) query = query.eq("division_code", params.division);
  if (params.status === "ranked") query = query.not("final_rank", "is", null);
  if (params.status === "penalty") query = query.gt("applied_penalty_ms", 0);
  const rawQ = (params.q ?? "").trim();
  const q = normalizeSearchTerm(rawQ);
  if (rawQ && !q) return { total: 0, results: [] };
  if (q) {
    query = query.or(`bib.ilike.%${q}%,display_name.ilike.%${q}%,school.ilike.%${q}%,team_name.ilike.%${q}%`);
  }
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const { data, error, count } = await query
    .order("final_rank", { ascending: true, nullsFirst: false })
    .order("final_time_ms", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (error || !data) return null;
  return { total: count ?? data.length, results: data.map((row) => rowToResult(row as ResultRow)) };
}

export async function getSupabaseDetail(bib: string, divisionCode: string) {
  const db = client();
  if (!db) return null;
  let query = db.from("result_entries").select("*").eq("event_slug", eventSlug).eq("bib", bib);
  if (divisionCode) query = query.eq("division_code", divisionCode);
  const { data: resultRow } = await query.maybeSingle<ResultRow>();
  if (!resultRow) return null;
  const result = rowToResult(resultRow);
  const { data: splitRows } = await db
    .from("split_entries")
    .select("*")
    .eq("event_slug", result.eventSlug)
    .eq("division_code", result.divisionCode)
    .eq("bib", result.bib)
    .order("split_order", { ascending: true })
    .returns<SplitRow[]>();
  const { data: divisionSplitRows } = await db
    .from("split_entries")
    .select("*")
    .eq("event_slug", result.eventSlug)
    .eq("division_code", result.divisionCode)
    .order("bib", { ascending: true })
    .order("split_order", { ascending: true })
    .returns<SplitRow[]>();
  const { data: rankRows } = await db.from("result_entries").select("*").eq("event_slug", result.eventSlug).returns<ResultRow[]>();
  return {
    result,
    splits: (splitRows ?? []).map(rowToSplit),
    divisionSplits: (divisionSplitRows ?? splitRows ?? []).map(rowToSplit),
    rankingPool: (rankRows ?? [resultRow]).map(rowToResult),
  };
}

async function countResultRows(
  db: SupabaseClient,
  mode: "total" | "ranked" | "appliedPenalty" | "cumulativePenalty",
): Promise<number | null> {
  let query = db.from("result_entries").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug);
  if (mode === "ranked") query = query.not("final_rank", "is", null);
  if (mode === "appliedPenalty") query = query.gt("applied_penalty_ms", 0);
  if (mode === "cumulativePenalty") query = query.gt("cumulative_penalty_ms", 0);
  const { count, error } = await query;
  return error ? null : count ?? 0;
}

function rowToResult(row: ResultRow): ResultEntry {
  return {
    eventSlug: row.event_slug,
    divisionCode: row.division_code,
    divisionName: row.division_name ?? "",
    groupName: row.group_name ?? "",
    projectName: row.project_name ?? "",
    bib: row.bib ?? "",
    displayName: row.display_name ?? "",
    teamName: row.team_name ?? "",
    school: row.school ?? "",
    gender: row.gender ?? "",
    rawRank: row.raw_rank,
    finalRank: row.final_rank,
    status: row.status ?? "FINISHED",
    netTimeMs: row.net_time_ms,
    cumulativePenaltyMs: row.cumulative_penalty_ms ?? 0,
    appliedPenaltyMs: row.applied_penalty_ms ?? 0,
    finalTimeMs: row.final_time_ms,
    netTimeText: row.net_time_text ?? "",
    cumulativePenaltyText: row.cumulative_penalty_text ?? "",
    appliedPenaltyText: row.applied_penalty_text ?? "",
    finalTimeText: row.final_time_text ?? "",
    penaltyStatus: row.penalty_status ?? "",
    note: row.note ?? "",
    sourceRow: row.source_row ?? 0,
  };
}

function rowToSplit(row: SplitRow): SplitEntry {
  return {
    eventSlug: row.event_slug,
    divisionCode: row.division_code,
    bib: row.bib,
    splitKey: row.split_key,
    splitLabel: row.split_label,
    splitOrder: row.split_order,
    splitTimeMs: row.split_time_ms,
    splitTimeText: row.split_time_text ?? "",
  };
}

function isNonEmptyString(value: string | null): value is string {
  return Boolean(value?.trim());
}
