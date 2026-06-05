import { NextResponse } from "next/server";
import { getStaticDataset, hasStaticDataset, queryStaticResults } from "@/lib/localData";
import {
  fetchSupabaseEvent,
  fetchSupabaseFilters,
  hasSupabaseConfig,
  querySupabaseResults,
} from "@/lib/supabaseData";
import { normalizeStatusFilter } from "@/lib/status";
import type { ResultListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = boundedInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = boundedInt(url.searchParams.get("pageSize"), 25, 1, 100);
  const status = normalizeStatusFilter(url.searchParams.get("status"));
  if (page === null) return badRequest("page must be a positive integer.");
  if (pageSize === null) return badRequest("pageSize must be between 1 and 100.");
  if (status === null) return badRequest("status is not supported.");

  const params = {
    q: trimParam(url.searchParams.get("q")),
    group: trimParam(url.searchParams.get("group")),
    project: trimParam(url.searchParams.get("project")),
    division: trimParam(url.searchParams.get("division")),
    status,
    page,
    pageSize,
  };

  if (hasSupabaseConfig()) {
    try {
      const [event, filters, queried] = await Promise.all([
        fetchSupabaseEvent(),
        fetchSupabaseFilters(),
        querySupabaseResults(params),
      ]);
      if (event && filters && queried) {
        const body: ResultListResponse = {
          source: "supabase",
          event,
          summary: filters.summary,
          filters: filters.filters,
          page,
          pageSize,
          total: queried.total,
          results: queried.results,
        };
        return NextResponse.json(body);
      }
    } catch {
      // Fall through to the bundled static data so a transient Supabase issue does not break the public site.
    }
  }

  if (!(await hasStaticDataset())) {
    return NextResponse.json(
      { error: "Ranking data is not generated. Run pnpm run build:data or configure Supabase." },
      { status: 503 },
    );
  }

  const dataset = await getStaticDataset();
  const queried = await queryStaticResults(params);
  const body: ResultListResponse = {
    source: "static",
    event: dataset.event,
    summary: dataset.summary,
    filters: dataset.filters,
    page,
    pageSize,
    total: queried.total,
    results: queried.results,
  };
  return NextResponse.json(body);
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

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
