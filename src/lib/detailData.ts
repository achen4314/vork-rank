import { getStaticDataset, getStaticDetail, hasStaticDataset } from "@/lib/localData";
import { buildResultDetailResponse } from "@/lib/performance";
import { getSupabaseDetail, hasSupabaseConfig } from "@/lib/supabaseData";
import type { ResultDetailResponse } from "@/lib/types";

export async function loadResultDetail(bib: string, divisionCode: string): Promise<ResultDetailResponse | null> {
  if (hasSupabaseConfig()) {
    try {
      const detail = await getSupabaseDetail(bib, divisionCode);
      if (detail) {
        return buildResultDetailResponse("supabase", detail.result, detail.splits, detail.rankingPool, detail.divisionSplits);
      }
    } catch {
      // Fall back to the static JSON snapshot when Supabase is temporarily unavailable.
    }
  }

  if (!(await hasStaticDataset())) return null;

  const dataset = await getStaticDataset();
  const detail = await getStaticDetail(bib, divisionCode);
  if (!detail.result) return null;
  return buildResultDetailResponse("static", detail.result, detail.splits, dataset.results, detail.divisionSplits);
}
