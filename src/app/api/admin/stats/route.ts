import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/registration/data";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("event") || defaultEventSlug;
  const stats = await getDashboardStats(eventSlug);
  return NextResponse.json(stats ?? {});
}
