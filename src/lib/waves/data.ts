import { getAdminDb } from "@/lib/supabase/admin";
import type { WaveEntry } from "@/lib/types";

const defaultEventSlug = "capital-college-fitness-2026";

type WaveRow = {
  id: number;
  event_slug: string;
  wave_label: string;
  start_time: string;
  interval_min: number;
  capacity: number;
  enrolled_count: number;
  project_filter: string[] | null;
  division_filter: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: WaveRow): WaveEntry {
  return {
    id: row.id,
    eventSlug: row.event_slug,
    waveLabel: row.wave_label,
    startTime: row.start_time,
    intervalMin: row.interval_min,
    capacity: row.capacity,
    enrolledCount: row.enrolled_count,
    projectFilter: row.project_filter,
    divisionFilter: row.division_filter,
    status: row.status as WaveEntry["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWaves(eventSlug?: string): Promise<WaveEntry[]> {
  const db = await getAdminDb();
  if (!db) return [];

  const { data } = await db
    .from("waves")
    .select("*")
    .eq("event_slug", eventSlug ?? defaultEventSlug)
    .order("start_time", { ascending: true })
    .returns<WaveRow[]>();

  return (data ?? []).map(rowToEntry);
}

export async function getWaveById(id: number): Promise<WaveEntry | null> {
  const db = await getAdminDb();
  if (!db) return null;

  const { data } = await db
    .from("waves")
    .select("*")
    .eq("id", id)
    .maybeSingle<WaveRow>();

  return data ? rowToEntry(data) : null;
}

export async function createWave(params: {
  eventSlug: string;
  waveLabel: string;
  startTime: string;
  intervalMin?: number;
  capacity: number;
  projectFilter?: string[];
  divisionFilter?: string[];
}): Promise<WaveEntry | null> {
  const db = await getAdminDb();
  if (!db) return null;

  const { data } = await db
    .from("waves")
    .insert({
      event_slug: params.eventSlug,
      wave_label: params.waveLabel,
      start_time: params.startTime,
      interval_min: params.intervalMin ?? 3,
      capacity: params.capacity,
      project_filter: params.projectFilter ?? null,
      division_filter: params.divisionFilter ?? null,
      status: "planned",
    })
    .select("*")
    .single<WaveRow>();

  return data ? rowToEntry(data) : null;
}

export async function updateWave(id: number, updates: Partial<WaveRow>): Promise<boolean> {
  const db = await getAdminDb();
  if (!db) return false;

  const { error } = await db
    .from("waves")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}

export async function deleteWave(id: number): Promise<boolean> {
  const db = await getAdminDb();
  if (!db) return false;

  const { error } = await db.from("waves").delete().eq("id", id);
  return !error;
}

export async function autoAssignWaves(
  eventSlug: string,
): Promise<{ success: boolean; message: string; assigned: number }> {
  const db = await getAdminDb();
  if (!db) return { success: false, message: "数据库连接失败", assigned: 0 };

  // Get all approved registrations without wave assignment
  const { data: registrations } = await db
    .from("registrations")
    .select("id, project, division_hint")
    .eq("event_slug", eventSlug)
    .or("status.eq.approved,status.eq.bib_assigned")
    .is("wave_label", null)
    .returns<{ id: number; project: string; division_hint: string | null }[]>();

  if (!registrations?.length) {
    return { success: false, message: "没有待分配的报名", assigned: 0 };
  }

  // Get all waves
  const { data: waves } = await db
    .from("waves")
    .select("*")
    .eq("event_slug", eventSlug)
    .order("start_time", { ascending: true })
    .returns<WaveRow[]>();

  if (!waves?.length) {
    return { success: false, message: "请先创建波次", assigned: 0 };
  }

  // Group registrations by project
  const byProject = new Map<string, number[]>();
  for (const reg of registrations) {
    const list = byProject.get(reg.project) ?? [];
    list.push(reg.id);
    byProject.set(reg.project, list);
  }

  let assigned = 0;

  for (const wave of waves) {
    if (wave.status === "full" || wave.status === "closed" || wave.status === "finished") continue;

    const available = wave.capacity - (wave.enrolled_count ?? 0);
    if (available <= 0) continue;

    // Get all registration IDs to assign to this wave
    const idsToAssign: number[] = [];
    for (const [project, ids] of byProject) {
      if (wave.project_filter?.length && !wave.project_filter.includes(project)) continue;

      const take = Math.min(available - idsToAssign.length, ids.length);
      idsToAssign.push(...ids.splice(0, take));
    }

    if (idsToAssign.length === 0) continue;

    // Assign wave
    const { error } = await db
      .from("registrations")
      .update({
        wave_label: wave.wave_label,
        start_time: wave.start_time,
        status: "wave_assigned",
        updated_at: new Date().toISOString(),
      })
      .in("id", idsToAssign);

    if (!error) {
      assigned += idsToAssign.length;
      // Update enrolled count
      await db
        .from("waves")
        .update({
          enrolled_count: wave.enrolled_count + idsToAssign.length,
          status: (wave.enrolled_count + idsToAssign.length) >= wave.capacity ? "full" : wave.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wave.id);
    }
  }

  return { success: true, message: `成功分配 ${assigned} 名选手`, assigned };
}

export async function autoAssignBibs(
  eventSlug: string,
): Promise<{ success: boolean; message: string; assigned: number }> {
  const db = await getAdminDb();
  if (!db) return { success: false, message: "数据库连接失败", assigned: 0 };

  // Get all registrations without bibs
  const { data: registrations } = await db
    .from("registrations")
    .select("id, project")
    .eq("event_slug", eventSlug)
    .or("status.eq.approved,status.eq.wave_assigned")
    .is("bib", null)
    .order("id", { ascending: true })
    .returns<{ id: number; project: string }[]>();

  if (!registrations?.length) {
    return { success: false, message: "没有待分配号码的报名", assigned: 0 };
  }

  // Use simple sequential bib numbering per project
  const bibRanges: Record<string, { prefix: string; padLen: number }> = {
    "单项测试": { prefix: "1", padLen: 3 },
    "男子单人": { prefix: "1", padLen: 3 },
    "女子单人": { prefix: "1", padLen: 3 },
    "男子双人": { prefix: "15", padLen: 2 },
    "女子双人": { prefix: "16", padLen: 2 },
    "混合4人": { prefix: "17", padLen: 2 },
  };

  let assigned = 0;
  const usedBibs = new Set<string>();

  // Get existing bibs
  const { data: existingBibs } = await db
    .from("registrations")
    .select("bib")
    .eq("event_slug", eventSlug)
    .not("bib", "is", null)
    .returns<{ bib: string }[]>();

  (existingBibs ?? []).forEach((r) => usedBibs.add(r.bib));

  // Also add bibs from result_entries (existing race data)
  const { data: existingResultBibs } = await db
    .from("result_entries")
    .select("bib")
    .eq("event_slug", eventSlug)
    .returns<{ bib: string }[]>();

  (existingResultBibs ?? []).forEach((r) => usedBibs.add(r.bib));

  for (const reg of registrations) {
    const range = bibRanges[reg.project];
    if (!range) continue;

    // Find next available bib
    let nextBib = "";
    let counter = 0;
    const maxAttempts = 9999;
    let attempts = 0;
    while (attempts < maxAttempts) {
      nextBib = range.prefix + String(counter).padStart(range.padLen, "0");
      if (!usedBibs.has(nextBib)) break;
      counter++;
      attempts++;
    }

    if (attempts >= maxAttempts) continue; // skip if no bib available

    usedBibs.add(nextBib);

    const { error } = await db
      .from("registrations")
      .update({
        bib: nextBib,
        status: "bib_assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reg.id);

    if (!error) assigned++;
  }

  return { success: true, message: `成功分配 ${assigned} 个号码`, assigned };
}
