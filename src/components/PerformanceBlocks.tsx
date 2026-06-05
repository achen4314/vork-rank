import type { JudgingDecision, RankBucket, RankContext, ReplayStep, WorkoutSummary } from "@/lib/types";

export function RaceReplay({ steps, compact = false }: { steps: ReplayStep[]; compact?: boolean }) {
  const visible = steps.filter((step) => step.timeMs !== null && step.timeMs > 0);
  if (!visible.length) {
    return <p className="rounded border border-[var(--line)] p-3 text-sm text-[var(--muted)]">暂无可回放的分段时间</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-10 overflow-hidden rounded border border-[var(--line)] bg-white">
        {visible.map((step) => (
          <div
            key={step.id}
            title={`${step.label} ${step.timeText}`}
            className={`min-w-2 ${stepClassName(step.kind)}`}
            style={{ flexBasis: `${step.widthPct}%`, flexGrow: step.widthPct, flexShrink: 1 }}
          />
        ))}
      </div>
      <div className={compact ? "grid gap-2 text-xs sm:grid-cols-2" : "grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3"}>
        {visible.map((step) => (
          <div key={step.id} className="flex items-center justify-between gap-3 rounded border border-[var(--line)] bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-[var(--brand-navy)]">{step.label}</p>
              <p className="text-[var(--muted)]">累计 {step.cumulativeText}</p>
            </div>
            <strong className="shrink-0">{step.timeText}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutSummaryTable({ summary, compact = false }: { summary: WorkoutSummary; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded border border-[var(--line)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-[var(--brand-navy)] text-left text-white">
            <tr>
              {["区段", "跑步段", "功能站", "换项/衔接", "区间总计", "数据状态"].map((head) => (
                <th key={head} className="border-b border-[rgba(255,255,255,0.18)] px-3 py-3 font-bold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.sections.map((section) => (
              <tr key={section.zone} className="border-b border-[var(--line)]">
                <td className="px-3 py-3 font-black text-[var(--brand-navy)]">{section.label}</td>
                <td className="px-3 py-3">
                  <SplitValue label={section.runLabel} value={section.runTimeText} missing={section.runTimeMs === null} />
                </td>
                <td className="px-3 py-3">
                  <SplitValue label={section.stationLabel} value={section.stationTimeText} missing={section.stationTimeMs === null} />
                </td>
                <td className="px-3 py-3">
                  <SplitValue label={section.transitionLabel} value={section.transitionTimeText} missing={section.transitionTimeMs === null} />
                </td>
                <td className="px-3 py-3 font-bold">{section.totalTimeText}</td>
                <td className="px-3 py-3">
                  <StatusBadge missing={section.missing} conflict={section.hasTimingConflict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && summary.extras.length ? (
        <div className="border-t border-[var(--line)] p-3">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">额外计时点</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.extras.map((step) => (
              <div key={step.id} className="flex items-center justify-between rounded border border-[var(--line)] px-3 py-2 text-sm">
                <span>{step.label}</span>
                <strong>{step.timeText}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function JudgingDecisionCard({ decision }: { decision: JudgingDecision }) {
  return (
    <section className={`rounded border p-4 ${decisionClassName(decision.tone)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Judging Decision</p>
          <h2 className="mt-1 text-xl font-black text-[var(--brand-navy)]">{decision.label}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <SmallMetric label="应用罚时" value={decision.penaltyText} />
          <SmallMetric label="累计罚时" value={decision.cumulativePenaltyText} />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ink)]">
        {decision.reasons.map((reason, index) => (
          <p key={`${index}-${reason}`} className="rounded border border-[rgba(23,27,64,0.12)] bg-white px-3 py-2">
            {reason}
          </p>
        ))}
      </div>
    </section>
  );
}

export function RankBuckets({ context }: { context: RankContext }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {[context.overall, context.gender, context.group, context.division].map((bucket) => (
        <RankBucketCard key={bucket.label} bucket={bucket} />
      ))}
    </div>
  );
}

function SplitValue({ label, value, missing }: { label: string; value: string; missing: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={missing ? "font-bold text-[var(--muted)]" : "font-bold"}>{missing ? "缺失" : value}</p>
    </div>
  );
}

function StatusBadge({ missing, conflict }: { missing: string[]; conflict: boolean }) {
  if (conflict) {
    return <span className="rounded bg-[#fff1f1] px-2 py-1 text-xs font-bold text-[var(--red)]">区间时间冲突</span>;
  }
  if (missing.length) {
    return <span className="rounded bg-[#fff8df] px-2 py-1 text-xs font-bold text-[#8a5a00]">缺 {missing.length} 项</span>;
  }
  return <span className="rounded bg-[var(--brand-soft)] px-2 py-1 text-xs font-bold text-[var(--brand-navy)]">完整</span>;
}

function RankBucketCard({ bucket }: { bucket: RankBucket }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-3">
      <p className="text-xs text-[var(--muted)]">{bucket.label}</p>
      <p className="mt-1 text-lg font-black text-[var(--brand-navy)]">
        {bucket.rank ? `第 ${bucket.rank} 名` : "未排名"}
      </p>
      <p className="text-xs text-[var(--muted)]">共 {bucket.total} 人</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function stepClassName(kind: ReplayStep["kind"]): string {
  if (kind === "run") return "bg-[var(--brand-navy)]";
  if (kind === "station") return "bg-[var(--brand-lime)]";
  if (kind === "transition") return "bg-[#6b7280]";
  if (kind === "aggregate") return "bg-[#8aa3ff]";
  return "bg-[#c7d2fe]";
}

function decisionClassName(tone: JudgingDecision["tone"]): string {
  if (tone === "penalty") return "border-[var(--red)] bg-[#fff7f7]";
  if (tone === "review") return "border-[#d59b00] bg-[#fffbec]";
  if (tone === "unranked") return "border-[var(--line)] bg-[#f3f4f6]";
  return "border-[var(--line)] bg-white";
}
