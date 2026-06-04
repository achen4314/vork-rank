import { NextResponse } from "next/server";
import { getStaticDetail, hasStaticDataset } from "@/lib/localData";
import { getSupabaseDetail, hasSupabaseConfig } from "@/lib/supabaseData";
import type { ResultDetailResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: { bib: string } }) {
  const url = new URL(request.url);
  const divisionCode = url.searchParams.get("division") ?? "";
  const bib = decodeURIComponent(context.params.bib);

  if (hasSupabaseConfig()) {
    const detail = await getSupabaseDetail(bib, divisionCode);
    if (detail) {
      const body: ResultDetailResponse = { source: "supabase", ...detail };
      return NextResponse.json(body);
    }
  }

  if (!hasStaticDataset()) {
    return NextResponse.json(
      { error: "Ranking data is not generated. Run pnpm run build:data or configure Supabase." },
      { status: 503 },
    );
  }

  const detail = getStaticDetail(bib, divisionCode);
  const body: ResultDetailResponse = { source: "static", ...detail };
  return NextResponse.json(body);
}
