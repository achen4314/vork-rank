import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import { selectClassName } from "@/components/RankFilters";
import type { ResultSelection } from "@/components/rankTypes";
import { compactText, formatDuration, rankDeltaText } from "@/lib/format";
import { sameEntry } from "@/lib/resultLinks";
import { statusLabel } from "@/lib/status";
import type { ResultEntry } from "@/lib/types";

const pageSizeOptions = [25, 50, 100];

type RankTableProps = {
  results: ResultEntry[];
  selected: ResultSelection | null;
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  onSelect: (entry: ResultEntry) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: string) => void;
};

export default function RankTable({
  results,
  selected,
  isLoading,
  total,
  page,
  pageSize,
  totalPages,
  pageStart,
  pageEnd,
  onSelect,
  onPageChange,
  onPageSizeChange,
}: RankTableProps) {
  const showSkeleton = isLoading && results.length === 0;

  return (
    <div className="overflow-hidden rounded border border-[var(--line)] bg-white shadow-sm">
      <div className="md:hidden">
        {showSkeleton ? <MobileSkeletonCards /> : <MobileResultCards results={results} selected={selected} onSelect={onSelect} />}
      </div>
      <div className="hidden max-h-[68vh] overflow-auto md:block">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="sticky top-0 bg-[var(--brand-navy)] text-left text-white">
            <tr>
              {["名次", "号码", "姓名/队名", "学校", "分组", "净成绩", "罚时", "最终成绩", "状态"].map((head) => (
                <th key={head} className="border-b border-[rgba(255,255,255,0.18)] px-3 py-3 font-bold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton ? <SkeletonRows /> : null}
            {!showSkeleton
              ? results.map((entry) => (
                  <tr
                    key={`${entry.divisionCode}-${entry.bib}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`选择选手 ${entry.displayName}，号码 ${entry.bib}`}
                    title={`选择 ${entry.displayName}`}
                    onClick={() => onSelect(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(entry);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--line)] transition hover:bg-[var(--brand-soft)] ${
                      selected && sameEntry(selected, entry) ? "bg-[var(--brand-soft)] shadow-[inset_4px_0_0_var(--brand-lime)]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-black">{entry.finalRank ?? "-"}</p>
                      {entry.rawRank !== entry.finalRank ? <p className="mt-1 text-xs text-[var(--muted)]">净 {entry.rawRank ?? "-"}</p> : null}
                    </td>
                    <td className="px-3 py-3">{entry.bib}</td>
                    <td className="px-3 py-3 font-bold">{entry.displayName}</td>
                    <td className="px-3 py-3">{compactText(entry.school, "未采集")}</td>
                    <td className="px-3 py-3">{entry.divisionName}</td>
                    <td className="px-3 py-3">{entry.netTimeText || formatDuration(entry.netTimeMs)}</td>
                    <td className="px-3 py-3 text-[var(--red)]">
                      <p>{penaltyDisplay(entry)}</p>
                      {entry.cumulativePenaltyMs !== entry.appliedPenaltyMs ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">累计 {formatDuration(entry.cumulativePenaltyMs)}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-black">{entry.finalTimeText || formatDuration(entry.finalTimeMs)}</td>
                    <td className="px-3 py-3">{statusLabel(entry.status)}</td>
                  </tr>
                ))
              : null}
            {!showSkeleton && results.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-sm text-[var(--muted)]">
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-3 py-3 text-sm">
        <p className="text-[var(--muted)]">
          共 <strong className="text-[var(--brand-navy)]">{total}</strong> 条，显示 {pageStart}-{pageEnd}，第{" "}
          <strong className="text-[var(--brand-navy)]">{page}</strong> / {totalPages} 页
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={pageSize} onChange={(event) => onPageSizeChange(event.target.value)} aria-label="每页条数" className={`${selectClassName} w-32`}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / 页
              </option>
            ))}
          </select>
          <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className={pagerButtonClassName}>
            <ChevronLeftIcon className="h-4 w-4" />
            上一页
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={pagerButtonClassName}
          >
            下一页
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileResultCards({
  results,
  selected,
  onSelect,
}: {
  results: ResultEntry[];
  selected: ResultSelection | null;
  onSelect: (entry: ResultEntry) => void;
}) {
  if (results.length === 0) {
    return <p className="px-3 py-10 text-center text-sm text-[var(--muted)]">暂无数据</p>;
  }

  return (
    <div className="grid gap-2 p-3">
      {results.map((entry) => {
        const isSelected = Boolean(selected && sameEntry(selected, entry));
        return (
          <button
            key={`${entry.divisionCode}-${entry.bib}`}
            type="button"
            aria-label={`选择选手 ${entry.displayName}，号码 ${entry.bib}`}
            onClick={() => onSelect(entry)}
            className={`rounded border p-3 text-left transition ${
              isSelected
                ? "border-[var(--brand-lime)] bg-[var(--brand-soft)]"
                : "border-[var(--line)] bg-white hover:border-[var(--brand-navy)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--muted)]">#{entry.finalRank ?? "未排名"} · {entry.bib}</p>
                <p className="mt-1 break-words text-base font-black text-[var(--brand-navy)]">{entry.displayName}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{entry.divisionName}</p>
                {entry.rawRank !== entry.finalRank ? <p className="mt-1 text-xs text-[var(--red)]">{rankDeltaText(entry.rawRank, entry.finalRank)}</p> : null}
              </div>
              <span className="shrink-0 rounded border border-[var(--line)] px-2 py-1 text-xs font-bold text-[var(--brand-navy)]">
                {statusLabel(entry.status)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <MobileMetric label="净成绩" value={entry.netTimeText || formatDuration(entry.netTimeMs)} />
              <MobileMetric label="应用罚时" value={penaltyDisplay(entry)} />
              <MobileMetric label="最终" value={entry.finalTimeText || formatDuration(entry.finalTimeMs)} strong />
            </div>
            {entry.cumulativePenaltyMs !== entry.appliedPenaltyMs ? (
              <p className="mt-2 text-xs font-bold text-[var(--red)]">累计罚时 {formatDuration(entry.cumulativePenaltyMs)}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted)]">{compactText(entry.school, "未采集")}</p>
          </button>
        );
      })}
    </div>
  );
}

function MobileMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="min-w-0 rounded border border-[var(--line)] bg-[var(--metric)] px-2 py-1">
      <span className="block text-[var(--muted)]">{label}</span>
      <strong className={`block truncate ${strong ? "text-[var(--brand-navy)]" : ""}`}>{value}</strong>
    </span>
  );
}

function MobileSkeletonCards() {
  return (
    <div className="grid gap-2 p-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded border border-[var(--line)] p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--line)]" />
          <div className="mt-2 h-5 w-40 animate-pulse rounded bg-[var(--line)]" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-10 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-10 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-10 animate-pulse rounded bg-[var(--line)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, row) => (
        <tr key={row} className="border-b border-[var(--line)]">
          {Array.from({ length: 9 }).map((__, cell) => (
            <td key={cell} className="px-3 py-3">
              <div className="h-4 animate-pulse rounded bg-[var(--line)]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const pagerButtonClassName =
  "inline-flex h-11 items-center justify-center gap-1 rounded border border-[var(--line)] bg-white px-3 font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)]";

function penaltyDisplay(entry: ResultEntry): string {
  if (entry.appliedPenaltyMs === 0) return "-";
  return entry.appliedPenaltyText || formatDuration(entry.appliedPenaltyMs);
}
