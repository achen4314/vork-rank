import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("event") || defaultEventSlug;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const db = await getAdminDb();
  if (!db) {
    return NextResponse.json({ data: [], total: 0 });
  }

  const { data, count } = await db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("event_slug", eventSlug)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
