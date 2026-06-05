import { ChevronLeft, ChevronRight } from "lucide-react";
import { selectClassName } from "@/components/RankFilters";
import type { ResultSelection } from "@/components/rankTypes";
import { compactText, formatDuration } from "@/lib/format";
import { sameEntry } from "@/lib/resultLinks";
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
      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
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
                    title="选择选手"
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
                    <td className="px-3 py-3 font-black">{entry.finalRank ?? "-"}</td>
                    <td className="px-3 py-3">{entry.bib}</td>
                    <td className="px-3 py-3 font-bold">{entry.displayName}</td>
                    <td className="px-3 py-3">{compactText(entry.school)}</td>
                    <td className="px-3 py-3">{entry.divisionName}</td>
                    <td className="px-3 py-3">{entry.netTimeText || formatDuration(entry.netTimeMs)}</td>
                    <td className="px-3 py-3 text-[var(--red)]">{entry.appliedPenaltyText || formatDuration(entry.appliedPenaltyMs)}</td>
                    <td className="px-3 py-3 font-black">{entry.finalTimeText || formatDuration(entry.finalTimeMs)}</td>
                    <td className="px-3 py-3">{entry.status}</td>
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
            <ChevronLeft className="h-4 w-4" />
            上一页
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={pagerButtonClassName}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
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
