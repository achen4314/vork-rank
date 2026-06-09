import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedClient: SupabaseClient | null | undefined;

export async function getAdminDb(): Promise<SupabaseClient | null> {
  if (cachedClient !== undefined) return cachedClient;
  if (!url || !serviceKey) {
    cachedClient = null;
    return cachedClient;
  }
  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export async function writeAuditLog(params: {
  eventSlug: string;
  tableName: string;
  recordId?: number | null;
  action: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy?: string | null;
  note?: string | null;
}): Promise<void> {
  const db = await getAdminDb();
  if (!db) return;
  try {
    await db.from("audit_logs").insert({
      event_slug: params.eventSlug,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      action: params.action,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      performed_by: params.performedBy ?? null,
      note: params.note ?? null,
    });
  } catch {
    // audit log failures should never block the main operation
  }
}
