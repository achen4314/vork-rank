import { NextResponse } from "next/server";
import { hasStaticDataset } from "@/lib/localData";
import { loadResultList, parseResultListQuery } from "@/lib/resultListData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseResultListQuery(url.searchParams);
  if (!parsed.ok) return badRequest(parsed.error);

  const body = await loadResultList(parsed.params);
  if (!body) {
    const hasFallback = await hasStaticDataset();
    return NextResponse.json(
      { error: hasFallback ? "Ranking data is temporarily unavailable." : "Ranking data is not generated. Run pnpm run build:data or configure Supabase." },
      { status: hasFallback ? 502 : 503 },
    );
  }
  return NextResponse.json(body);
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
