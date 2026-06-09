import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabaseData";
import { normalizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event") || "capital-college-fitness-2026";
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ results: [] });
  }

  const normalized = normalizeSearchTerm(q);
  if (!normalized) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(url, key, { auth: { persistSession: false } });

    const { data } = await db
      .from("result_entries")
      .select("bib,display_name,division_code,division_name,school,project_name")
      .eq("event_slug", event)
      .or(
        `bib.ilike.%${normalized}%,display_name.ilike.%${normalized}%,school.ilike.%${normalized}%`
      )
      .order("final_rank", { ascending: true, nullsFirst: false })
      .limit(limit);

    const results = (data ?? []).map((row: Record<string, string>) => ({
      bib: row.bib ?? "",
      name: row.display_name ?? "",
      divisionCode: row.division_code ?? "",
      divisionName: row.division_name ?? "",
      school: row.school ?? "",
      project: row.project_name ?? "",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
