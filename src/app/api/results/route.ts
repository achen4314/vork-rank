import { NextResponse } from "next/server";
import { getStaticDataset, hasStaticDataset, queryStaticResults } from "@/lib/localData";
import {
  fetchSupabaseEvent,
  fetchSupabaseFilters,
  hasSupabaseConfig,
  querySupabaseResults,
} from "@/lib/supabaseData";
import type { ResultListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.min(positiveInt(url.searchParams.get("page"), 1), 10_000);
  const pageSize = Math.min(positiveInt(url.searchParams.get("pageSize"), 25), 100);
  const params = {
    q: url.searchParams.get("q") ?? "",
    group: url.searchParams.get("group") ?? "",
    project: url.searchParams.get("project") ?? "",
    division: url.searchParams.get("division") ?? "",
    status: url.searchParams.get("status") ?? "",
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

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
