import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Metric from "@/components/Metric";
import { JudgingDecisionCard, RaceReplay } from "@/components/PerformanceBlocks";
import { compactText, formatDuration, rankLabel } from "@/lib/format";
import { resultHref } from "@/lib/resultLinks";
import type { ResultDetailResponse, ResultEntry } from "@/lib/types";

type RankDetailProps = {
  selected: ResultEntry | null;
  detail: ResultDetailResponse | null;
  isLoading: boolean;
  error: string;
  onRetry: () => void;
};

export default function RankDetail({ selected, detail, isLoading, error, onRetry }: RankDetailProps) {
  const entry = detail?.result ?? selected;

  return (
    <aside className="rounded border border-[var(--line)] bg-white p-4 shadow-sm">
      {entry ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--muted)]">{entry.bib}</p>
              <h2 className="text-xl font-black text-[var(--brand-navy)]">{entry.displayName}</h2>
              <p className="text-sm text-[var(--muted)]">{entry.divisionName}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded bg-[var(--brand-navy)] p-2">
              <Image src="/brand/vork-mark-lime.png" alt="" width={358} height={188} sizes="48px" className="h-auto w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="最终名次" value={rankLabel(entry.finalRank)} />
            <Metric label="最终成绩" value={entry.finalTimeText || formatDuration(entry.finalTimeMs)} />
            <Metric label="净成绩" value={entry.netTimeText || formatDuration(entry.netTimeMs)} />
            <Metric label="应用罚时" value={entry.appliedPenaltyText || formatDuration(entry.appliedPenaltyMs)} />
          </div>
          <Link
            href={resultHref(entry)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:bg-white"
          >
            <ArrowUpRight className="h-4 w-4" />
            完整详情页
          </Link>

          {error ? <RetryNotice message={error} onRetry={onRetry} /> : null}
          {isLoading ? <DetailSkeleton /> : null}

          {!isLoading && !error && detail?.judgingDecision ? (
            <JudgingDecisionCard decision={detail.judgingDecision} compact />
          ) : null}
          {!isLoading && !error && !detail?.judgingDecision ? (
            <div className="rounded border border-[var(--line)] p-3 text-sm">
              <p className="font-bold text-[var(--brand-navy)]">Judging Decision</p>
              <p className="mt-1 text-[var(--muted)]">{compactText(entry.note || entry.penaltyStatus, "无")}</p>
            </div>
          ) : null}
          {!isLoading && !error && detail?.raceReplay.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[var(--brand-navy)]">Race Replay</p>
              <RaceReplay steps={detail.raceReplay} compact />
            </div>
          ) : null}
          {!isLoading && !error && detail?.workoutSummary.sections.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[var(--brand-navy)]">Workout Summary</p>
              {detail.workoutSummary.sections.slice(0, 6).map((section) => (
                <div key={section.zone} className="rounded border border-[var(--line)] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-[var(--brand-navy)]">{section.label}</strong>
                    <span>{section.totalTimeText}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    跑 {section.runTimeText} / 项 {section.stationTimeText} / 换 {section.transitionTimeText}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">暂无数据</p>
      )}
    </aside>
  );
}

function RetryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded border border-[var(--red)] bg-white p-3 text-sm text-[var(--red)]">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="mt-2 h-9 rounded border border-[var(--red)] px-3 font-bold transition hover:bg-[var(--brand-soft)]">
        重试
      </button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded border border-[var(--line)] p-3">
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--line)]" />
      <div className="h-16 animate-pulse rounded bg-[var(--line)]" />
      <div className="h-16 animate-pulse rounded bg-[var(--line)]" />
    </div>
  );
}
