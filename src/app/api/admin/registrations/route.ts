import { NextResponse } from "next/server";
import { queryRegistrations, getRegistrationById, updateRegistration } from "@/lib/registration/data";
import { writeAuditLog } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event") || defaultEventSlug;
  const status = searchParams.get("status") || undefined;
  const project = searchParams.get("project") || undefined;
  const wave = searchParams.get("wave") || undefined;
  const q = searchParams.get("q") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const result = await queryRegistrations({
    eventSlug: event,
    filters: { status: status as never, project, wave, q },
    page,
    limit,
  });

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, updates, note } = body as {
      id?: number;
      updates?: Record<string, unknown>;
      note?: string;
    };

    if (!id || !updates) {
      return NextResponse.json({ success: false, message: "缺少参数" }, { status: 400 });
    }

    const old = await getRegistrationById(id);
    if (!old) {
      return NextResponse.json({ success: false, message: "报名不存在" }, { status: 404 });
    }

    const success = await updateRegistration(id, updates as never);
    if (!success) {
      return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
    }

    await writeAuditLog({
      eventSlug: old.eventSlug,
      tableName: "registrations",
      recordId: id,
      action: "update",
      oldData: { status: old.status, bib: old.bib, waveLabel: old.waveLabel },
      newData: updates,
      note: note ?? undefined,
    });

    const updated = await getRegistrationById(id);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}
