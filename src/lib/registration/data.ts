import type { RegistrationEntry, RegistrationFilters } from "@/lib/types";
import { getAdminDb } from "@/lib/supabase/admin";

const defaultEventSlug = "capital-college-fitness-2026";

type RegistrationRow = {
  id: number;
  event_slug: string;
  name: string;
  gender: string;
  id_card: string | null;
  phone: string;
  email: string;
  birth_date: string | null;
  nationality: string;
  organization: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  project: string;
  division_hint: string | null;
  team_name: string | null;
  teammates: unknown;
  status: string;
  status_note: string | null;
  health_ok: boolean;
  waiver_ok: boolean;
  medical_note: string | null;
  bib: string | null;
  division_code: string | null;
  wave_label: string | null;
  start_time: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

function rowToEntry(row: RegistrationRow): RegistrationEntry {
  return {
    id: row.id,
    eventSlug: row.event_slug,
    name: row.name,
    gender: row.gender,
    idCard: row.id_card,
    phone: row.phone,
    email: row.email,
    birthDate: row.birth_date,
    nationality: row.nationality ?? "中国",
    organization: row.organization,
    emergencyName: row.emergency_name,
    emergencyPhone: row.emergency_phone,
    project: row.project,
    divisionHint: row.division_hint,
    teamName: row.team_name,
    teammates: Array.isArray(row.teammates) ? row.teammates : null,
    status: row.status as RegistrationEntry["status"],
    statusNote: row.status_note,
    healthOk: row.health_ok ?? false,
    waiverOk: row.waiver_ok ?? false,
    medicalNote: row.medical_note,
    bib: row.bib,
    divisionCode: row.division_code,
    waveLabel: row.wave_label,
    startTime: row.start_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

export async function queryRegistrations(params: {
  eventSlug?: string;
  filters?: RegistrationFilters;
  page?: number;
  limit?: number;
}): Promise<{ data: RegistrationEntry[]; total: number }> {
  const db = await getAdminDb();
  if (!db) return { data: [], total: 0 };

  const event = params.eventSlug || defaultEventSlug;
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const filters = params.filters ?? {};

  let query = db
    .from("registrations")
    .select("*", { count: "exact" })
    .eq("event_slug", event)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.project) query = query.eq("project", filters.project);
  if (filters.wave) query = query.eq("wave_label", filters.wave);
  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},phone.ilike.${q},email.ilike.${q},team_name.ilike.${q}`);
  }

  const { data, count, error } = await query.returns<RegistrationRow[]>();
  if (error || !data) return { data: [], total: 0 };

  return { data: data.map(rowToEntry), total: count ?? data.length };
}

export async function getRegistrationById(id: number): Promise<RegistrationEntry | null> {
  const db = await getAdminDb();
  if (!db) return null;

  const { data } = await db
    .from("registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle<RegistrationRow>();

  return data ? rowToEntry(data) : null;
}

export async function updateRegistration(id: number, updates: Partial<RegistrationRow>): Promise<boolean> {
  const db = await getAdminDb();
  if (!db) return false;

  const { error } = await db
    .from("registrations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}

export async function queryRegistrationByEmail(
  eventSlug: string,
  email: string,
): Promise<RegistrationEntry[]> {
  const db = await getAdminDb();
  if (!db) return [];

  const { data } = await db
    .from("registrations")
    .select("*")
    .eq("event_slug", eventSlug)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .returns<RegistrationRow[]>();

  return (data ?? []).map(rowToEntry);
}

export async function getDashboardStats(eventSlug: string) {
  const db = await getAdminDb();
  if (!db) return null;

  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: waveAssigned },
    { count: checkedIn },
    { data: byProject },
    { data: byStatus },
  ] = await Promise.all([
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug),
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug).eq("status", "pending"),
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug).or("status.eq.approved,status.eq.bib_assigned,status.eq.wave_assigned,status.eq.confirmed,status.eq.checked_in,status.eq.racing,status.eq.finished"),
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug).eq("status", "rejected"),
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug).not("wave_label", "is", null),
    db.from("registrations").select("id", { count: "exact", head: true }).eq("event_slug", eventSlug).eq("status", "checked_in"),
    db.from("registrations").select("project").eq("event_slug", eventSlug),
    db.from("registrations").select("status").eq("event_slug", eventSlug),
  ]);

  const projectCounts = new Map<string, number>();
  (byProject ?? []).forEach((r: { project: string }) => {
    projectCounts.set(r.project, (projectCounts.get(r.project) ?? 0) + 1);
  });

  const statusCounts = new Map<string, number>();
  (byStatus ?? []).forEach((r: { status: string }) => {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  });

  const { data: waves } = await db
    .from("waves")
    .select("wave_label, capacity, enrolled_count")
    .eq("event_slug", eventSlug)
    .order("start_time", { ascending: true });

  return {
    totalRegistrations: total ?? 0,
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0,
    waveAssigned: waveAssigned ?? 0,
    checkedIn: checkedIn ?? 0,
    byProject: Array.from(projectCounts.entries()).map(([project, count]) => ({ project, count })),
    byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
    waveUtilization: (waves ?? []).map((w: { wave_label: string; capacity: number; enrolled_count: number }) => ({
      waveLabel: w.wave_label,
      capacity: w.capacity,
      enrolled: w.enrolled_count,
    })),
  };
}
