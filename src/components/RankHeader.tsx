import Image from "next/image";
import Metric from "@/components/Metric";
import type { ResultListResponse } from "@/lib/types";

export default function RankHeader({ data, isLoading }: { data: ResultListResponse | null; isLoading: boolean }) {
  const showSkeleton = isLoading && !data;

  return (
    <header className="brand-shell overflow-hidden rounded border border-[var(--brand-navy)] bg-white">
      <div className="brand-stripe" aria-hidden="true" />
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-20 shrink-0 place-items-center rounded-sm bg-[var(--brand-navy)] p-2">
            <Image
              src="/brand/vork-mark-lime.png"
              alt="VORK 图形标"
              width={358}
              height={188}
              priority
              sizes="80px"
              className="h-auto w-full"
            />
          </div>
          <div className="min-w-0">
            <Image src="/brand/vork-wordmark.png" alt="VORK" width={439} height={94} priority sizes="140px" className="h-5 w-auto" />
            <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--brand-navy)] sm:text-3xl">
              {data?.event.name ?? "首都高校体能竞速邀请赛"}
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {showSkeleton ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <Metric label="总人数" value={data?.summary.total ?? "-"} />
              <Metric label="已排名" value={data?.summary.ranked ?? "-"} />
              <Metric label="罚时" value={data?.summary.appliedPenaltyCount ?? "-"} />
              <Metric label="数据源" value={data?.source === "supabase" ? "Supabase" : data ? "本地" : "-"} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
      <div className="h-3 w-14 animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-2 h-5 w-20 animate-pulse rounded bg-[var(--line)]" />
    </div>
  );
}
