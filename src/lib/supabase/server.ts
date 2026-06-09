import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // ignore in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore in middleware
          }
        },
      },
    },
  );
}

export async function getAuthenticatedUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? "" };
}

export async function isAdmin(userId: string): Promise<{
  role: string;
  eventSlug: string | null;
} | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("admins")
    .select("role, event_slug")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    role: String(data.role ?? ""),
    eventSlug: data.event_slug ? String(data.event_slug) : null,
  };
}
