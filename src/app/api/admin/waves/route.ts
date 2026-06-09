import { NextResponse } from "next/server";
import { listWaves, createWave, updateWave, deleteWave, getWaveById } from "@/lib/waves/data";
import { writeAuditLog } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("event") || defaultEventSlug;
  const data = await listWaves(eventSlug);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventSlug, waveLabel, startTime, intervalMin, capacity, projectFilter, divisionFilter } =
      body as {
        eventSlug?: string;
        waveLabel?: string;
        startTime?: string;
        intervalMin?: number;
        capacity?: number;
        projectFilter?: string[];
        divisionFilter?: string[];
      };

    if (!waveLabel || !startTime || !capacity) {
      return NextResponse.json(
        { success: false, message: "缺少必填字段" },
        { status: 400 }
      );
    }

    const wave = await createWave({
      eventSlug: eventSlug || defaultEventSlug,
      waveLabel,
      startTime,
      intervalMin,
      capacity,
      projectFilter,
      divisionFilter,
    });

    if (!wave) {
      return NextResponse.json(
        { success: false, message: "创建失败" },
        { status: 500 }
      );
    }

    await writeAuditLog({
      eventSlug: eventSlug || defaultEventSlug,
      tableName: "waves",
      recordId: wave.id,
      action: "insert",
      newData: body,
    });

    return NextResponse.json({ success: true, data: wave });
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id?: number; [key: string]: unknown };

    if (!id) {
      return NextResponse.json({ success: false, message: "缺少ID" }, { status: 400 });
    }

    const old = await getWaveById(id);
    const success = await updateWave(id, updates as never);

    if (success && old) {
      await writeAuditLog({
        eventSlug: old.eventSlug,
        tableName: "waves",
        recordId: id,
        action: "update",
        oldData: { waveLabel: old.waveLabel, capacity: old.capacity },
        newData: updates,
      });
    }

    const updated = await getWaveById(id);
    return NextResponse.json({ success, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) {
      return NextResponse.json({ success: false, message: "缺少ID" }, { status: 400 });
    }

    const old = await getWaveById(id);
    const success = await deleteWave(id);

    if (success && old) {
      await writeAuditLog({
        eventSlug: old.eventSlug,
        tableName: "waves",
        recordId: id,
        action: "delete",
        oldData: { waveLabel: old.waveLabel, capacity: old.capacity },
      });
    }

    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}
