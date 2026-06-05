import { getStaticDataset, getStaticDetail, hasStaticDataset } from "@/lib/localData";
import { buildResultDetailResponse } from "@/lib/performance";
import { getSupabaseDetail, hasSupabaseConfig } from "@/lib/supabaseData";
import type { ResultDetailResponse } from "@/lib/types";

export async function loadResultDetail(bib: string, divisionCode: string): Promise<ResultDetailResponse | null> {
  if (hasSupabaseConfig()) {
    const detail = await getSupabaseDetail(bib, divisionCode);
    if (detail) {
      return buildResultDetailResponse("supabase", detail.result, detail.splits, detail.rankingPool);
    }
  }

  if (!hasStaticDataset()) return null;

  const dataset = getStaticDataset();
  const detail = getStaticDetail(bib, divisionCode);
  if (!detail.result) return null;
  return buildResultDetailResponse("static", detail.result, detail.splits, dataset.results);
}
