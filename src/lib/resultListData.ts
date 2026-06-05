import { getStaticDataset, hasStaticDataset, queryStaticResults } from "@/lib/localData";
import {
  fetchSupabaseEvent,
  fetchSupabaseFilters,
  hasSupabaseConfig,
  querySupabaseResults,
} from "@/lib/supabaseData";
import { normalizeStatusFilter, type StatusFilter } from "@/lib/status";
import type { ResultListResponse } from "@/lib/types";

export type ResultListQuery = {
  q: string;
  group: string;
  project: string;
  division: string;
  status: StatusFilter;
  page: number;
  pageSize: number;
};

export type ParseResultListQueryResult =
  | { ok: true; params: ResultListQuery }
  | { ok: false; error: string };

export const defaultPageSize = 25;

export function parseResultListQuery(params: { get(name: string): string | null }): ParseResultListQueryResult {
  const page = boundedInt(params.get("page"), 1, 1, 10_000);
  const pageSize = boundedInt(params.get("pageSize"), defaultPageSize, 1, 100);
  const status = normalizeStatusFilter(params.get("status"));
  if (page === null) return { ok: false, error: "page must be a positive integer." };
  if (pageSize === null) return { ok: false, error: "pageSize must be between 1 and 100." };
  if (status === null) return { ok: false, error: "status is not supported." };

  return {
    ok: true,
    params: {
      q: trimParam(params.get("q")),
      group: trimParam(params.get("group")),
      project: trimParam(params.get("project")),
      division: trimParam(params.get("division")),
      status,
      page,
      pageSize,
    },
  };
}

export function searchParamsRecord(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
    } else if (value) {
      params.set(key, value);
    }
  });
  return params;
}

export async function loadResultList(params: ResultListQuery): Promise<ResultListResponse | null> {
  if (hasSupabaseConfig()) {
    try {
      const [event, filters, queried] = await Promise.all([
        fetchSupabaseEvent(),
        fetchSupabaseFilters(),
        querySupabaseResults(params),
      ]);
      if (event && filters && queried) {
        return {
          source: "supabase",
          event,
          summary: filters.summary,
          filters: filters.filters,
          page: params.page,
          pageSize: params.pageSize,
          total: queried.total,
          results: queried.results,
        };
      }
    } catch {
      // Fall through to the bundled static data so a transient Supabase issue does not break the public site.
    }
  }

  if (!(await hasStaticDataset())) return null;

  const dataset = await getStaticDataset();
  const queried = await queryStaticResults(params);
  return {
    source: "static",
    event: dataset.event,
    summary: dataset.summary,
    filters: dataset.filters,
    page: params.page,
    pageSize: params.pageSize,
    total: queried.total,
    results: queried.results,
  };
}

function boundedInt(value: string | null, fallback: number, min: number, max: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function trimParam(value: string | null): string {
  return value?.trim() ?? "";
}
