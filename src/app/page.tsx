import RankExplorer from "@/components/RankExplorer";
import { loadResultList, parseResultListQuery, searchParamsRecord } from "@/lib/resultListData";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const parsed = parseResultListQuery(searchParamsRecord(searchParams ?? {}));
  const initialData = parsed.ok ? await loadResultList(parsed.params) : null;
  return <RankExplorer initialData={initialData} initialError={parsed.ok ? "" : parsed.error} />;
}
