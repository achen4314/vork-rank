import { NextResponse } from "next/server";
import { autoAssignWaves, autoAssignBibs } from "@/lib/waves/data";
import { writeAuditLog } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, eventSlug } = body as {
      type?: "waves" | "bibs";
      eventSlug?: string;
    };

    const event = eventSlug || defaultEventSlug;

    let result: { success: boolean; message: string; assigned: number };

    if (type === "bibs") {
      result = await autoAssignBibs(event);
    } else {
      result = await autoAssignWaves(event);
    }

    if (result.success && result.assigned > 0) {
      await writeAuditLog({
        eventSlug: event,
        tableName: "registrations",
        action: type === "bibs" ? "auto_assign_bibs" : "auto_assign_waves",
        note: `自动${type === "bibs" ? "分配号码" : "分配波次"}: ${result.message}`,
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
