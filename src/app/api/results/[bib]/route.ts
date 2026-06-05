import { NextResponse } from "next/server";
import { hasStaticDataset } from "@/lib/localData";
import { loadResultDetail } from "@/lib/detailData";
import { hasSupabaseConfig } from "@/lib/supabaseData";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: { bib: string } }) {
  const url = new URL(request.url);
  const divisionCode = url.searchParams.get("division") ?? "";
  const bib = decodeURIComponent(context.params.bib);

  const body = await loadResultDetail(bib, divisionCode);
  if (body) return NextResponse.json(body);

  if (!hasSupabaseConfig() && !hasStaticDataset()) {
    return NextResponse.json(
      { error: "Ranking data is not generated. Run pnpm run build:data or configure Supabase." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Result not found." }, { status: 404 });
}
