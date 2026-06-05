"use client";

import RankDetail from "@/components/RankDetail";
import RankFilters from "@/components/RankFilters";
import RankHeader from "@/components/RankHeader";
import RankTable from "@/components/RankTable";
import { useRankExplorer } from "@/components/useRankExplorer";
import type { ResultListResponse } from "@/lib/types";

export default function RankExplorer({
  initialData = null,
  initialError = "",
}: {
  initialData?: ResultListResponse | null;
  initialError?: string;
}) {
  const rank = useRankExplorer({ initialData, initialError });

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <RankHeader data={rank.data} isLoading={rank.isListLoading} />
        <RankFilters
          filters={rank.filters}
          searchValue={rank.searchValue}
          options={rank.options}
          onSearchChange={rank.setSearchValue}
          onFilterChange={rank.updateFilter}
          onReset={rank.resetFilters}
        />

        {rank.listError ? <RetryNotice message={rank.listError} onRetry={rank.retryList} /> : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <RankTable
            results={rank.data?.results ?? []}
            selected={rank.selected}
            isLoading={rank.isListLoading}
            total={rank.total}
            page={rank.page}
            pageSize={rank.pageSize}
            totalPages={rank.totalPages}
            pageStart={rank.pageStart}
            pageEnd={rank.pageEnd}
            onSelect={rank.selectEntry}
            onPageChange={rank.setPage}
            onPageSizeChange={rank.updatePageSize}
          />
          <RankDetail
            selected={rank.selectedEntry}
            detail={rank.detail}
            isLoading={rank.isDetailLoading}
            error={rank.detailError}
            onRetry={rank.retryDetail}
          />
        </section>
      </section>
    </main>
  );
}

function RetryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--red)] bg-white p-4 text-sm text-[var(--red)]">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="h-9 rounded border border-[var(--red)] px-3 font-bold transition hover:bg-[var(--brand-soft)]">
        重试
      </button>
    </section>
  );
}
