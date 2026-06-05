import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeStartwaveSuffix, queryStaticStartwave } from "@/lib/startwaveStatic";
import type { StartwaveEntry, StartwaveResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const defaultEventSlug = "capital-college-fitness-2026";

let cachedClient: SupabaseClient | null | undefined;

type RequestBody = {
  name?: unknown;
  phoneSuffix?: unknown;
  event?: unknown;
};

type EventRow = {
  slug: string;
  name: string;
  event_date: string | null;
  venue: string | null;
};

type StartwaveEntryRow = {
  athlete_id: number;
  project_name: string;
  wave_label: string;
  start_date: string;
  start_time: string | null;
  start_datetime: string;
  bib_or_chip: string;
  team_code: string | null;
  team_name: string | null;
  member_index: number | null;
  gender: string | null;
  division: string;
  organization: string | null;
};

type StartwaveAthleteRow = {
  id: number;
  name: string;
  phone_masked: string | null;
};

async function getDb(): Promise<SupabaseClient | null> {
  if (cachedClient !== undefined) return cachedClient;
  if (!url || !anon) {
    cachedClient = null;
    return cachedClient;
  }
  const { createClient } = await import("@supabase/supabase-js");
  cachedClient = createClient(url, anon, { auth: { persistSession: false } });
  return cachedClient;
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) {
    return json({ success: false, message: "请求格式错误，请使用 JSON 格式" }, 400);
  }

  const name = stringValue(body.value.name).trim();
  if (!name) {
    return json({ success: false, message: "请输入姓名" }, 400);
  }

  const event = stringValue(body.value.event).trim() || defaultEventSlug;
  if (!/^[a-z0-9][a-z0-9-]{0,120}$/i.test(event)) {
    return json({ success: false, message: "赛事参数无效" }, 400);
  }

  const suffix = normalizeStartwaveSuffix(body.value.phoneSuffix);
  if (suffix === null) {
    return json({ success: false, message: "后四位需为 4 位数字或字母" }, 400);
  }

  const db = await getDb();
  if (!db) {
    return fallbackOrStatus(event, name, suffix, "服务暂时不可用，请稍后重试", 503);
  }

  try {
    const [eventRow, athletesResult] = await Promise.all([fetchEvent(db, event), fetchAthletes(db, event, name, suffix)]);
    if (athletesResult.error) {
      const status = missingStartwaveTable(athletesResult.error.code) ? 503 : 500;
      const message = status === 503 ? "出发名单正在同步，请稍后重试" : "查询失败，请稍后重试";
      return fallbackOrStatus(event, name, suffix, message, status);
    }

    const athletes = athletesResult.data ?? [];
    if (!athletes.length) {
      const fallback = await queryStaticStartwave(event, name, suffix);
      return json(fallback ?? { success: false, message: `未找到 "${name}" 的报名记录，请检查姓名是否正确` });
    }

    const entriesResult = await fetchEntries(db, event, athletes.map((athlete) => athlete.id));
    if (entriesResult.error) {
      const status = missingStartwaveTable(entriesResult.error.code) ? 503 : 500;
      const message = status === 503 ? "出发名单正在同步，请稍后重试" : "查询失败，请稍后重试";
      return fallbackOrStatus(event, name, suffix, message, status);
    }
    const entriesByAthlete = groupEntriesByAthlete(entriesResult.data ?? []);

    if (athletes.length > 1) {
      return json({
        success: false,
        multiple: true,
        message: suffix ? `找到 ${athletes.length} 位匹配选手，请联系现场工作人员确认报名信息` : `存在 ${athletes.length} 位同名选手，请输入手机号或证件号后四位区分`,
        candidates: athletes.map((athlete) => ({
          name: athlete.name,
          projects: uniqueProjects(entriesByAthlete.get(athlete.id) ?? []),
        })),
      });
    }

    const athlete = athletes[0];
    const entries = (entriesByAthlete.get(athlete.id) ?? []).map(rowToEntry).sort(compareEntries);
    if (!entries.length) {
      const fallback = await queryStaticStartwave(event, name, suffix);
      if (fallback?.success && fallback.entries.length) return json(fallback);
    }
    return json({
      success: true,
      event: {
        slug: eventRow?.slug ?? event,
        name: eventRow?.name ?? "首都高校体能竞速邀请赛",
        date: eventRow?.event_date ?? entries[0]?.startDate ?? "",
        venue: eventRow?.venue ?? "北京大学",
      },
      athlete: {
        name: athlete.name,
        phoneMasked: athlete.phone_masked ?? null,
      },
      entries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const fallback = await queryStaticStartwave(event, name, suffix);
    return json(fallback ?? { success: false, message: "服务器错误，请稍后重试", error: message }, fallback ? 200 : 500);
  }
}

async function readJson(request: Request): Promise<{ ok: true; value: RequestBody } | { ok: false }> {
  try {
    return { ok: true, value: (await request.json()) as RequestBody };
  } catch {
    return { ok: false };
  }
}

async function fetchEvent(db: SupabaseClient, event: string): Promise<EventRow | null> {
  const { data } = await db.from("events").select("slug,name,event_date,venue").eq("slug", event).maybeSingle<EventRow>();
  return data ?? null;
}

async function fetchAthletes(db: SupabaseClient, event: string, name: string, suffix: string | undefined) {
  let query = db
    .from("startwave_athletes")
    .select("id,name,phone_masked")
    .eq("event_slug", event)
    .eq("name", name);

  if (suffix) {
    query = query.or(`phone_suffix.eq.${suffix},id_card_suffix.eq.${suffix}`);
  }

  return query.returns<StartwaveAthleteRow[]>();
}

async function fetchEntries(db: SupabaseClient, event: string, athleteIds: number[]) {
  return db
    .from("startwave_entries")
    .select(
      "athlete_id,project_name,wave_label,start_date,start_time,start_datetime,bib_or_chip,team_code,team_name,member_index,gender,division,organization",
    )
    .eq("event_slug", event)
    .in("athlete_id", athleteIds)
    .returns<StartwaveEntryRow[]>();
}

function rowToEntry(row: StartwaveEntryRow): StartwaveEntry {
  return {
    projectName: row.project_name,
    waveLabel: row.wave_label,
    startDate: row.start_date,
    startTime: String(row.start_time ?? "").slice(0, 5),
    startDatetime: row.start_datetime,
    bibOrChip: row.bib_or_chip,
    teamCode: row.team_code,
    teamName: row.team_name,
    memberIndex: row.member_index,
    gender: row.gender,
    division: row.division,
    organization: row.organization,
  };
}

function compareEntries(a: StartwaveEntry, b: StartwaveEntry): number {
  const time = a.startDatetime.localeCompare(b.startDatetime);
  if (time !== 0) return time;
  return a.projectName.localeCompare(b.projectName, "zh-Hans-CN");
}

function uniqueProjects(entries: StartwaveEntryRow[]): string[] {
  return [...new Set(entries.map((entry) => entry.project_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function groupEntriesByAthlete(entries: StartwaveEntryRow[]): Map<number, StartwaveEntryRow[]> {
  const grouped = new Map<number, StartwaveEntryRow[]>();
  entries.forEach((entry) => {
    const current = grouped.get(entry.athlete_id) ?? [];
    current.push(entry);
    grouped.set(entry.athlete_id, current);
  });
  return grouped;
}

function missingStartwaveTable(code: string | undefined): boolean {
  return code === "42P01" || code === "PGRST205";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function fallbackOrStatus(event: string, name: string, suffix: string | undefined, message: string, status: number) {
  const fallback = await queryStaticStartwave(event, name, suffix);
  return json(fallback ?? { success: false, message }, fallback ? 200 : status);
}

function json(body: StartwaveResponse, status = 200) {
  return NextResponse.json(body, { status });
}
