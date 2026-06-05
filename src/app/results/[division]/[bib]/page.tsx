import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "@/components/PrintButton";
import { JudgingDecisionCard, RaceReplay, RankBuckets, WorkoutSummaryTable } from "@/components/PerformanceBlocks";
import ShareButton from "@/components/ShareButton";
import { compactText, formatDuration, rankLabel } from "@/lib/format";
import { loadResultDetail } from "@/lib/detailData";

type DetailPageProps = {
  params: {
    division: string;
    bib: string;
  };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const division = decodeParam(params.division);
  const bib = decodeParam(params.bib);
  const detail = await loadResultDetail(bib, division);
  const name = detail?.result?.displayName ?? bib;
  return {
    title: `${name} | Vork Rank`,
    description: `${name} 的首都高校体能竞速邀请赛成绩单`,
  };
}

export default async function ResultDetailPage({ params }: DetailPageProps) {
  const division = decodeParam(params.division);
  const bib = decodeParam(params.bib);
  const detail = await loadResultDetail(bib, division);
  const result = detail?.result;

  if (!detail || !result) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-[960px] flex-col gap-4 rounded border border-[var(--line)] bg-white p-6">
          <img src="/brand/vork-wordmark.png" alt="VORK" className="h-6 w-fit" />
          <h1 className="text-2xl font-black text-[var(--brand-navy)]">未找到该选手成绩</h1>
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--brand-navy)]">
            <ArrowLeft className="h-4 w-4" />
            返回排行榜
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="print-surface mx-auto flex max-w-[1280px] flex-col gap-4">
        <nav className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回排行榜
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ShareButton />
            <PrintButton />
          </div>
        </nav>

        <header className="overflow-hidden rounded border border-[var(--brand-navy)] bg-white">
          <div className="brand-stripe" aria-hidden="true" />
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-14 w-20 shrink-0 place-items-center rounded-sm bg-[var(--brand-navy)] p-2">
                <img src="/brand/vork-mark-lime.png" alt="VORK 图形标" className="h-auto w-full" />
              </div>
              <div className="min-w-0">
                <img src="/brand/vork-wordmark.png" alt="VORK" className="h-5 w-auto" />
                <p className="mt-3 text-sm font-bold text-[var(--muted)]">{result.bib}</p>
                <h1 className="text-3xl font-black leading-tight text-[var(--brand-navy)] sm:text-4xl">{result.displayName}</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">{result.divisionName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Metric label="最终名次" value={rankLabel(result.finalRank)} />
              <Metric label="最终成绩" value={result.finalTimeText || formatDuration(result.finalTimeMs)} />
              <Metric label="净成绩" value={result.netTimeText || formatDuration(result.netTimeMs)} />
              <Metric label="数据源" value={detail.source === "supabase" ? "Supabase" : "本地"} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded border border-[var(--line)] bg-white p-4">
            <h2 className="text-lg font-black text-[var(--brand-navy)]">选手信息</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Info label="号码" value={result.bib} />
              <Info label="姓名/队名" value={result.displayName} />
              <Info label="学校/俱乐部" value={compactText(result.school || result.teamName, "未采集")} />
              <Info label="性别" value={compactText(result.gender, "未采集")} />
              <Info label="国籍" value="未采集" />
              <Info label="年龄组" value={compactText(result.groupName, "未采集")} />
              <Info label="项目" value={compactText(result.projectName, "未采集")} />
              <Info label="状态" value={result.status} />
            </div>
          </div>
          <div className="rounded border border-[var(--line)] bg-white p-4">
            <h2 className="text-lg font-black text-[var(--brand-navy)]">排名概览</h2>
            <div className="mt-3">
              <RankBuckets context={detail.rankContext} />
            </div>
          </div>
        </section>

        <JudgingDecisionCard decision={detail.judgingDecision} />

        <section className="rounded border border-[var(--line)] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--muted)]">Race Replay</p>
              <h2 className="text-xl font-black text-[var(--brand-navy)]">比赛节奏时间轴</h2>
            </div>
            <Metric label="回放总计" value={detail.workoutSummary.replayTotalText} />
          </div>
          <div className="mt-4">
            <RaceReplay steps={detail.raceReplay} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--muted)]">Workout Summary</p>
              <h2 className="text-xl font-black text-[var(--brand-navy)]">跑步段 / 功能站 / 换项拆分</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="缺失计时" value={detail.workoutSummary.missingCount} />
              <Metric label="时间冲突" value={detail.workoutSummary.conflictCount} />
            </div>
          </div>
          <WorkoutSummaryTable summary={detail.workoutSummary} />
        </section>

        <section className="rounded border border-[var(--line)] bg-white p-4">
          <h2 className="text-lg font-black text-[var(--brand-navy)]">原始计时点</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {detail.splits.map((split) => (
              <div key={`${split.splitOrder}-${split.splitKey}`} className="flex items-center justify-between rounded border border-[var(--line)] px-3 py-2 text-sm">
                <span>{split.splitLabel}</span>
                <strong>{split.splitTimeText || formatDuration(split.splitTimeMs)}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
