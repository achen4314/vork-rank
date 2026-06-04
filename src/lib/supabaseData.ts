import { createClient } from "@supabase/supabase-js";
import type { EventInfo, RankingFilters, RankingSummary, ResultEntry, SplitEntry } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(url && anon);
}

function client() {
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function fetchSupabaseEvent(): Promise<EventInfo | null> {
  const db = client();
  if (!db) return null;
  const { data, error } = await db.from("events").select("*").eq("slug", "capital-college-fitness-2026").maybeSingle();
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
  const { data, error } = await db.from("result_entries").select("*").eq("event_slug", "capital-college-fitness-2026");
  if (error || !data) return null;
  const rows = data.map(rowToResult);
  const divisions = Array.from(new Map(rows.map((r) => [r.divisionCode, { code: r.divisionCode, name: r.divisionName }])).values());
  return {
    summary: {
      total: rows.length,
      ranked: rows.filter((r) => r.finalRank !== null).length,
      unranked: rows.filter((r) => r.finalRank === null).length,
      divisionCount: divisions.length,
      appliedPenaltyCount: rows.filter((r) => r.appliedPenaltyMs > 0).length,
      cumulativePenaltyCount: rows.filter((r) => r.cumulativePenaltyMs > 0).length,
      sourceUpdatedAt: new Date().toISOString(),
    },
    filters: {
      groups: [...new Set(rows.map((r) => r.groupName).filter(Boolean))].sort(),
      projects: [...new Set(rows.map((r) => r.projectName).filter(Boolean))].sort(),
      divisions,
    },
  };
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
  let query = db.from("result_entries").select("*", { count: "exact" }).eq("event_slug", "capital-college-fitness-2026");
  if (params.group) query = query.eq("group_name", params.group);
  if (params.project) query = query.eq("project_name", params.project);
  if (params.division) query = query.eq("division_code", params.division);
  if (params.status === "ranked") query = query.not("final_rank", "is", null);
  if (params.status === "penalty") query = query.gt("applied_penalty_ms", 0);
  const q = (params.q ?? "").trim().replace(/[,()]/g, " ");
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
  return { total: count ?? data.length, results: data.map(rowToResult) };
}

export async function getSupabaseDetail(bib: string, divisionCode: string) {
  const db = client();
  if (!db) return null;
  let query = db.from("result_entries").select("*").eq("event_slug", "capital-college-fitness-2026").eq("bib", bib);
  if (divisionCode) query = query.eq("division_code", divisionCode);
  const { data: resultRow } = await query.maybeSingle();
  if (!resultRow) return null;
  const result = rowToResult(resultRow);
  const { data: splitRows } = await db
    .from("split_entries")
    .select("*")
    .eq("event_slug", result.eventSlug)
    .eq("division_code", result.divisionCode)
    .eq("bib", result.bib)
    .order("split_order", { ascending: true });
  return { result, splits: (splitRows ?? []).map(rowToSplit) };
}

function rowToResult(row: any): ResultEntry {
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

function rowToSplit(row: any): SplitEntry {
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
