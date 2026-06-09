import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabaseData";

type Props = { params: { bib: string } };

export const dynamic = "force-dynamic";

export default async function ParticipantRedirect({ params }: Props) {
  const slug = "capital-college-fitness-2026";

  if (hasSupabaseConfig()) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await db
        .from("result_entries")
        .select("division_code")
        .eq("event_slug", slug)
        .eq("bib", params.bib)
        .maybeSingle<{ division_code: string }>();

      if (data?.division_code) {
        redirect(
          `/results/${encodeURIComponent(data.division_code)}/${encodeURIComponent(params.bib)}`
        );
      }
    } catch {}
  }

  redirect(`/results/race-results?q=${encodeURIComponent(params.bib)}`);
}
